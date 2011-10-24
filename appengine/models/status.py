import logging
from google.appengine.ext import db


# ============================================================
# Parent is the associated word.
class Status(db.Expando):
    state = db.IntegerProperty()
    when = db.DateTimeProperty(auto_now = True)

    txt = db.StringListProperty()


# ============================================================
def get_status(word, last_state):
    # Lookup statuses with parent of word and state greater
    # than last_state.
    return None
