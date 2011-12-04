import logging, random
from google.appengine.ext import db
from google.appengine.ext import blobstore

import json


# ============================================================
# Key name is the word in question.
class Word(db.Expando):
    requested = db.DateTimeProperty(auto_now_add = True)
    updated = db.DateTimeProperty(auto_now = True)

    result = db.TextProperty()

    ip = db.StringProperty(default = '?')

    payload = db.TextProperty(default = '{}')

    rngvec = db.ListProperty(int)

    _dict = None
    _dirty = False

    def word(self):
        return self.key().name()

    def completed(self):
        return self.result != None

    # ----------------------------------------
    def get_rng(self, index = 0):
        if self.rngvec:
            seed = self.rngvec[index % len(self.rngvec)] + index
        else:
            seed = index
        rng = random.WichmannHill(seed)
        return rng

    # ----------------------------------------
    def set_result(self, result = None):
        self.result = json.dumps(result)

    # ----------------------------------------
    def unpack_payload(self):
        if self._dict:
            return
        self._dict = json.loads(self.payload)

    def persist_payload(self, force_persist = False):
        if (self._dirty or force_persist) and self._dict:
            self.payload = json.dumps(self._dict)
            logging.info('PERSISTING PAYLOAD for %s' % self.word())
            self.put()

    def get(self, key, default = None):
        self.unpack_payload()
        return self._dict[key] if self._dict and key in self._dict else default

    def set(self, key, value):
        self.unpack_payload()
        self._dict[key] = value
        self._dirty = True


# ============================================================
# Word must be cleansed first.
# Creates new word if needed, kicking off processing.
def get_word(word, ip = None):
    def _txn():
        new = False
        w = Word.get_by_key_name(word)
        if w is None:
            w = Word(key_name = word)
            if ip:
                w.ip = ip
            w.put()
            new = True
        return (w, new)

    return db.run_in_transaction(_txn)


# ============================================================
def all_words(alphabetic = False):
    words = []

    if alphabetic:
        all = Word.all().order('__key__')
    else:
        all = Word.all().order('-requested')

    for w in all:
        word = w.word()
        from models.status import get_latest_state
        state = get_latest_state(word, no_cache = False)
        words.append({
                'word': word,
                'status': state,
                'requested': w.requested,
                'updated': w.updated,
                'complete': w.result if w.completed() else None,
                'ip': w.ip,
                'payload': w.payload
                })

    return words
