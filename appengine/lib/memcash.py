from lib import helpers
import logging
import os, random, time, sys

from google.appengine.api import memcache
from google.appengine.ext import db
from google.appengine.datastore import entity_pb


# ------------------------------------------------------------
CURRENT_VERSION_ID = os.environ.get('CURRENT_VERSION_ID', '0')
local_cache = {}
DOG_PILE_WINDOW = 10 # seconds


# ------------------------------------------------------------
def flush_cash():
    logging.info('MEMCASH FLUSH LOCAL')
    global local_cache
    local_cache.clear()

def flush_cash_fn(fn, *args, **kwargs):
    try:
        flusher = getattr(fn, '_memcash_flush_')
        if flusher:
            flusher(*args, **kwargs)
            logging.info('FLUSHED %s' % fn.__name__)
        else:
            logging.error('No memcash flush function found for %s!' % fn.__name__)
    except Exception, e:
        logging.exception('flush_cash_fn: %s for %s (%s)' % (e, fn.__name__, fn.__module__))

def feed_cash_fn(fn, val, *args, **kwargs):
    try:
        feeder = getattr(fn, '_memcash_feed_')
        if feeder:
            feeder(val, *args, **kwargs)
        else:
            logging.error('No memcash feed function found for %s!' % fn.__name__)
    except Exception, e:
        logging.exception('feed_cash_fn: %s for %s (%s)' % (e, fn.__name__, fn.__module__))

def has_cashed_fn(fn, *args, **kwargs):
    try:
        has_cashed = getattr(fn, '_memcash_has_cached_')
        if has_cashed:
            cashed_it = has_cashed(*args, **kwargs)
            return cashed_it
        else:
            logging.error('No has_cashed function found for %s!' % fn.__name__)
    except Exception, e:
        logging.exception('has_cashed_fn: %s for %s (%s)' % (e, fn.__name__, fn.__module__))
        return False


# ------------------------------------------------------------
def serialize_entities(models):
    if models is None:
        return None
    elif isinstance(models, db.Model):
        # Just one instance
        return db.model_to_protobuf(models).Encode()
    else:
        # A list
        return [db.model_to_protobuf(x).Encode() for x in models]

def deserialize_entities(data):
    if data is None:
        return None
    elif isinstance(data, str):
        # Just one instance
        return db.model_from_protobuf(entity_pb.EntityProto(data))
    else:
        return [db.model_from_protobuf(entity_pb.EntityProto(x)) for x in data]


# ============================================================
def cash(ttl=60, key=None, ver=CURRENT_VERSION_ID, pre='', off=False, db_models=False):
    """
    Copyright (C)  2009  twitter.com/rcb

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.

    ======================================================================

    Builds a decorator that caches any function for ttl (time to live) secs
    using both a local dict and memcache.  Keys are strings but can be static,
    formatting, or callable, and caching can be disabled entirely.  Keys
    are auto invalidated on each deployment because keys include the
    application's current_version_id by default.

    It is called 'cash' because it can save lots of money in API CPU.

    >>> count = 0
    >>> def inc():
    ...     global count
    ...     count+=1
    ...     return count

    >>> @cash()              # uses 'foo' in key
    ... def foo(*a):
    ...     return inc()
    >>> foo(1,2) == foo(1,2)
    True
    >>> foo(1,1) != foo(2,2) # varies by args
    True
    >>> @cash(key='foo:%s:%s', ver=1)
    ... def foo(*a):
    ...     return inc()
    >>> foo(1,2) == foo(1,2)
    True
    >>> foo(1,1) != foo(2,2) # vary by args
    True

    >>> @cash(key=lambda *a,**k: 'foo:%s'%(a[0]+a[1],), ver=2)
    ... def foo(*a):
    ...     return inc()
    >>> foo(1,2) == foo(1,2)
    True
    >>> foo(1,3) == foo(3,1) # dynamic key
    True

    >>> @cash(off=True, ver=3)
    ... def foo(*a):
    ...     return inc()
    >>> foo.__name__         # not wrapped
    'foo'
    >>> foo() != foo()       # caching disabled
    True

    ## can uncomment slow tests
    # >>> @cash(ttl=1, ver=4)
    # ... def foo(*a):
    # ...     return inc()
    # >>> val = foo()
    # >>> foo() == val         # cached
    # True
    # >>> time.sleep(2)
    # >>> foo() != val         # new value
    # True
    #
    # >>> @cash(ttl=0, ver=5)
    # ... def foo(*a):
    # ...     return inc()
    # >>> val = foo()
    # >>> foo() == val         # cached
    # True
    # >>> time.sleep(1)
    # >>> foo() == val         # does not expire
    # True

    :param key: A formatting string or callable accepting args.
    :param ttl: Time to live in seconds: 0 means do not expire.
    :param ver: Version id: defaults to app current version id.
    :param pre: A Key prefix that will be applied to every key.
    :param off: Caching will be disabled if off is set to True.
    """

    ttl = long(ttl)
    keytmpl = 'cash(v=%s,k=%s:%%s)' % (ver,pre)
    def decorator(wrapped):
        if off:
            return wrapped
        if callable(key):
            make_key = key
        else:
            if key:
                kee = str(key)
            else:
                name = getattr(wrapped, '__name__', 'wrapper')
                if name == 'wrapper':
                    raise ValueError('cash(key=?) needs a key')
                kee = '__name__:%s' % name
            count = kee.count('%')
            if count:
                make_key = lambda *a, **k: kee % a[:count]
            else:
                make_key = lambda *a, **k: '%s(%s)'%(kee,','.join(map(str,a)))

        def wrapper(*args, **kwargs):
            now = long(time.time())
            keystr = keytmpl % make_key(*args, **kwargs)

            # Attempt to fetch from local cache.
            global local_cache
            if keystr in local_cache:
                expire, val = local_cache[keystr]
            	if expire - now > DOG_PILE_WINDOW:
                    logging.info('MEMCASH FOUND IN LOCAL %s' % keystr)
            	    return val

            # Attempt to fetch from memcache.
            cachedval = memcache.get(keystr)
            if cachedval:
                logging.info('MEMCASH FOUND IN MEMCACHE %s' % keystr)
                (expire, val, serialized) = cachedval
                if serialized:
                    try:
                        val = deserialize_entities(val)
                    except:
                        logging.exception('MEMCASH DESERIALIZE_ENTITIES exception!')
                        val = None
                        cachedval = None
                """ probabilistically avoid a dog pile """
                if ttl > DOG_PILE_WINDOW or ttl == 0:
                    remaining = expire - now
                    if DOG_PILE_WINDOW > remaining:
                        if random.uniform(0, DOG_PILE_WINDOW) > remaining:
                            logging.info('MEMCASH EXPIRING %s' % keystr)
                            cachedval = None

            # Not found in any cache (or expired) so calculate and store.
            if cachedval is None:
                if ttl == 0:
                    expire = now + 60*60*24*28 # 28 days
                else:
                    expire = now + ttl
            	val = wrapped(*args, **kwargs)
                if db_models:
                    try:
                        logging.info('MEMCASHING DB.MODEL %s' % keystr)
                        memcache.set(keystr, (expire, serialize_entities(val), True), ttl)
                    except:
                        logging.exception('MEMCASH SERIALIZE_ENTITIES exception!')
                        memcache.set(keystr, (expire, val, False), ttl)
                else:
                    logging.info('MEMCASHING %s' % keystr)
                    memcache.set(keystr, (expire, val, False), ttl)
            local_cache[keystr] = (expire, val)
            return val

        setattr(wrapper, '_memcash_key_fn_', make_key)
        setattr(wrapper, '__name__', 'memcashed_%s-%s' % \
                    (wrapped.__name__, wrapped.__module__))

        def flush(*args, **kwargs):
            keystr = keytmpl % make_key(*args, **kwargs)
#            logging.info('MEMCASH FLUSHING %s' % keystr)
            global local_cache
            if keystr in local_cache:
                del local_cache[keystr]
                logging.info('MEMCASH LOCAL FLUSHED %s' % keystr)
            if memcache.delete(keystr) == 2:
                logging.info('MEMCASH MEMCACHE FLUSHED %s' % keystr)
        setattr(wrapper, '_memcash_flush_', flush)

        def feed(val, *args, **kwargs):
            keystr = keytmpl % make_key(*args, **kwargs)
            now = long(time.time())
            if ttl == 0:
                expire = now + 60*60*24*28 # 28 days
            else:
                expire = now + ttl
            global local_cache
            local_cache[keystr] = (expire, val)
            if db_models:
                try:
                    logging.info('FORCE MEMCASHING DB.MODEL %s' % keystr)
                    memcache.set(keystr, (expire, serialize_entities(val), True), ttl)
                except:
                    logging.exception('FORCE MEMCASH SERIALIZE_ENTITIES exception!')
                    memcache.set(keystr, (expire, val, False), ttl)
        setattr(wrapper, '_memcash_feed_', feed)

        def has_cached(*args, **kwargs):
            keystr = keytmpl % make_key(*args, **kwargs)
            global local_cache
            if keystr in local_cache:
                return 'local'
            elif memcache.get(keystr):
                return 'memcache'
            return False
        setattr(wrapper, '_memcash_has_cached_', has_cached)

        return wrapper
    return decorator

cache=cash
