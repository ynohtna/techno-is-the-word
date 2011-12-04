from imports import *

from google.appengine.ext import ereporter

if not config.SETTINGS['ON_DEV']:
    ereporter.register_logger()


# ============================================================
from views import *

routes = [
        (r'/status/(.*)', status.Status),
        (r'/result/(.*)', result.Result),
        (r'/.*', home.HomePage)
    ]

# ============================================================
import webapp2
application = webapp2.WSGIApplication(routes, debug = config.SETTINGS['ON_DEV'])
