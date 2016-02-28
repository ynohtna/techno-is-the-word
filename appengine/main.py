from imports import *

from google.appengine.ext import ereporter

if not config.SETTINGS['ON_DEV']:
    ereporter.register_logger()


# ============================================================
from views import *
from views import view
from google.appengine.ext.webapp import blobstore_handlers

class serveRandomSample(view.Handler, blobstore_handlers.BlobstoreDownloadHandler):
    def get(self):
        try:
            from models.sample import Sample
            import random as rand
            sample = Sample.choose_random('?', rand.random(), rand)
            if sample and sample.data:
                self.send_blob(sample.data)
            else:
                return self.response.set_status(404)
        except Exception, e:
            logging.error('SAMPLE GET EXCEPTION! %s' % repr(e))
            return self.response.set_status(404)

class serveSample(view.Handler, blobstore_handlers.BlobstoreDownloadHandler):
    def get(self, sid = None):
        try:
            from models.sample import Sample
            sample = Sample.get_by_id(int(sid))
            if sample and sample.data:
                self.send_blob(sample.data)
            else:
                import random as rand
                sample = Sample.choose_random('?', rand.random(), rand)
                if sample and sample.data:
                    self.send_blob(sample.data)
                else:
                    return self.response.set_status(404)
        except Exception, e:
            logging.error('SAMPLE GET EXCEPTION! %s' % repr(e))
            return self.response.set_status(404)

class redirectWord(webapp.RequestHandler):
    def get(self, word = None):
        if word:
            self.redirect('/#' + word)
        else:
            self.redirect('/')


# ============================================================
routes = [
        (r'/status/(.*)', status.Status),
        (r'/result/(.*)', result.Result),
        (r'/sample/random', serveRandomSample),
        (r'/sample/(.*)', serveSample),
        (r'/word/(.*)', redirectWord),
        (r'/(.+)', redirectWord),
        (r'/', home.HomePage)
    ]

# ============================================================
import webapp2
application = webapp2.WSGIApplication(routes, debug = config.SETTINGS['ON_DEV'])
