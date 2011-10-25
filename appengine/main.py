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
def main():
    # Setup AppEngine.
    from google.appengine.dist import use_library
    use_library('django', config.SETTINGS['DJANGO_VER'])

    # Setup application.
    application = webapp.WSGIApplication(routes, debug = config.SETTINGS['ON_DEV'])

    # Go!
    from google.appengine.ext.webapp.util import run_wsgi_app
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
