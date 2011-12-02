import logging
from google.appengine.ext import db


# ============================================================
# Parent is the associated word.
# Keyname is the state triple digit formatted (e.g. 000, 023, 999).
class Status(db.Expando):
    when = db.DateTimeProperty(auto_now = True)

    state = db.IntegerProperty()
    txt = db.StringListProperty()


# ============================================================
from google.appengine.api import memcache
STATUS_CACHE = {}

def update_cache(word, latest_state):
    global STATUS_CACHE
    STATUS_CACHE[word] = latest_state
    memcache.set(word, latest_state)

def from_cache(word):
    '''Returns None if status is not cached.'''
    global STATUS_CACHE
    if word in STATUS_CACHE:
#        logging.info('LOCAL CACHE')
        return STATUS_CACHE[word]
    status = memcache.get(word)
    if status:
#        logging.info('MEM CACHE')
        return status
    return None

def clear_cache():
    global STATUS_CACHE
    STATUS_CACHE.clear()
    memcache.flush_all()


# ============================================================
def _wkey(word):
    return db.Key.from_path('Word', word)


# ============================================================
def get_status(word, last_state):
    wkey = _wkey(word)

    # Lookup statuses with parent of word and state greater
    # than last_state.
    s = Status.all().ancestor(wkey).filter('state >', last_state) \
        .order('state').fetch(1000)

    # Update cache.
    update_cache(word, last_state)

    return s


# ============================================================
# Check cache for this.
def get_latest_state(word):
    status = from_cache(word)
    if status:
        return status

    wkey = _wkey(word)
    skey = Status.all(keys_only = True).ancestor(wkey).order('-__key__').get()
    return -1 if skey == None else int(skey.name())


# ============================================================
# Cache latest states per word in memory for fast early outs.
def has_fresh_state(word, last_state):
    status = from_cache(word)
    if not status:
        status = get_latest_state(word)

    return status > last_state


# ============================================================
def set_status(word, state, txt):
    skey = '%03i' % state
    wkey = _wkey(word)

    if not isinstance(txt, list):
        txt = [txt]

    s = Status(parent = wkey,
               key_name = skey,
               state = state,
               txt = txt)
    s.put()

    # Update latest state cache if necessary.
    update_cache(word, state)
