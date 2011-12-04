import logging
from google.appengine.ext import db
from google.appengine.ext import blobstore


# ============================================================
class Sample(db.Model):
    rnd = db.FloatProperty()

    created = db.DateTimeProperty(auto_now_add = True)
    ip = db.StringProperty(default = '?')

    type = db.StringProperty(default = 'unknown')
    notes = db.StringProperty(default = '')

    data = blobstore.BlobReferenceProperty()
    processed = blobstore.BlobReferenceProperty()

    filename = db.StringProperty(default = 'unknown')
    size = db.IntegerProperty(default = 0)
    mime = db.StringProperty(default = 'unknown')

    @classmethod
    def new(cls, *args, **kwargs):
        from random import random
        return cls(rnd = random(), *args, **kwargs)


# ============================================================
