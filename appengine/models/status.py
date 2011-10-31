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

    return s


# ============================================================
# Check cache for this.
def get_latest_state(word):
    wkey = _wkey(word)
    skey = Status.all(keys_only = True).ancestor(wkey).order('-__key__').get()
    return -1 if skey == None else int(skey.name())


# ============================================================
# Cache latest states per word in memory for fast early outs.
def has_fresh_state(word, last_state):
    return get_latest_state(word) > last_state


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
