from imports import *

from jinja2 import Environment, FileSystemLoader, TemplateNotFound


# ============================================================
class Handler(webapp.RequestHandler):
    # FIXME: Use pre-compiled Python loader instead of FileSystemLoader a la
    # http://appengine-cookbook.appspot.com/recipe/better-performance-with-jinja2/
    __jinja_template_loader = FileSystemLoader([os.path.join(os.path.dirname(__file__),
                                                             '../templates')])
    jinja_env = Environment(loader = __jinja_template_loader,
                            autoescape = True,
                            extensions = ['jinja2.ext.autoescape'])

    # ----------------------------------------
    def render_to_string(self, template_name, values = None):
        try:
            template = self.jinja_env.get_template(template_name)
        except TemplateNotFound:
            raise TemplateNotFound(template_name)
        if values is None:
            values = {}
        content = template.render(values)
        return content

    # ----------------------------------------
    def render(self, template_name, values = None):
        try:
            content = self.render_to_string(template_name, values)
            self.response.out.write(content)
        except Exception, e:
            logging.exception('TEMPLATE RENDER EXCEPTION! %s' % e)

            if not config.SETTINGS['ON_DEV']:
                self.response.out.write('Bad vibes in the air.')
            else:
                raise

    # ========================================
    def default_values(self, no_cache = False):
        values = {
            'settings': config.SETTINGS,
            'app_id': config.SETTINGS['APP_ID'],
            'version_id': config.SETTINGS['APP_VERSION_ID'],
            'on_dev': config.SETTINGS['ON_DEV'],

            'no_cache': no_cache
            }

        return values
