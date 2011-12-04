from imports import *

from google.appengine.ext import ereporter

if not config.SETTINGS['ON_DEV']:
    ereporter.register_logger()


# ============================================================
from views import *
from views import view
from google.appengine.ext.webapp import blobstore_handlers

class serveSample(view.Handler, blobstore_handlers.BlobstoreDownloadHandler):
    def get(self, sid = None):
        try:
            from models.sample import Sample
            sample =  Sample.get_by_id(int(sid))
            if sample and sample.data:
                self.send_blob(sample.data)
            else:
                return self.response.set_status(404)
        except Exception, e:
            logging.error('SAMPLE GET EXCEPTION! %s' % repr(e))
            return self.response.set_status(404)


routes = [
        (r'/status/(.*)', status.Status),
        (r'/result/(.*)', result.Result),
        (r'/sample/(.*)', serveSample),
        (r'/.*', home.HomePage)
    ]

# ============================================================
import webapp2
application = webapp2.WSGIApplication(routes, debug = config.SETTINGS['ON_DEV'])
