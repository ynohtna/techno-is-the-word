import logging
from google.appengine.ext import db
from google.appengine.ext import blobstore


# ============================================================
# Key name is the word in question.
class Word(db.Expando):
    requested = db.DateTimeProperty(auto_now_add = True)
    updated = db.DateTimeProperty(auto_now = True)

    result = blobstore.BlobReferenceProperty()

    ip = db.StringProperty(default = '?')

    def word(self):
        return self.key().name()

    def completed(self):
        return self.result != None

    def result_url(self):
        return '/result/%s' % self.word()


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
        from models.status import from_cache
        state = from_cache(word)
        status = '%i' % state if state else '?'
        words.append({
                'word': word,
                'status': status,
                'requested': w.requested,
                'updated': w.updated,
                'complete': w.result_url() if w.completed() else None,
                'ip': w.ip
                })

    return words
