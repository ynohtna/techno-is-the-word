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

    @classmethod
    def choose_random(cls, type, rnd):
        '''rnd is [0..1]'''
        s = Sample.all().order('rnd').filter('rnd >=', rnd).get()
        if s == None:
            s = Sample.all().order('rnd').filter('rnd <', rnd).get()
        return s

    def serve_url(self):
        return '/sample/%i' % self.key().id()


# ============================================================
