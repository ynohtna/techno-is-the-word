import logging
from google.appengine.ext import db
from google.appengine.ext import blobstore


# ============================================================
# Key name is the word in question.
class Word(db.Expando):
    requested = db.DateTimeProperty(auto_now_add = True)
    updated = db.DateTimeProperty(auto_now = True)

    result = blobstore.BlobReferenceProperty()

    def word(self):
        return self.key().name()

    def completed(self):
        return self.result != None

    def result_url(self):
        return '/result/%s' % self.word()


# ============================================================
# Word must be cleansed first.
# Creates new word if needed, kicking off processing.
def get_word(word):
    def _txn():
        new = False
        w = Word.get_by_key_name(word)
        if w is None:
            w = Word(key_name = word)
            w.put()
            new = True
        return (w, new)

    return db.run_in_transaction(_txn)
