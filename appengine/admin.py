from imports import *

from google.appengine.ext import ereporter

if not config.SETTINGS['ON_DEV']:
    ereporter.register_logger()


# ============================================================
from views import *

routes = [
        (r'/_ah/nimda/flush', admin.Flush),
        (r'/_ah/nimda/list', admin.Words),
        (r'/_ah/nimda/samples', admin.Samples),
        (r'/_ah/nimda/upload', admin.Upload),
        (r'/_ah/nimda/fetch', admin.FetchTechno),
        (r'/_ah/nimda/filter', admin.FilterTechno)
    ]


# ============================================================
import webapp2

# Setup application.
application = webapp2.WSGIApplication(routes, debug = config.SETTINGS['ON_DEV'])
