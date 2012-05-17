import os

application_id = os.environ.get('APPLICATION_ID', 'techno-is-the-word')
full_version_id = os.environ.get('CURRENT_VERSION_ID', '0')
version_id = full_version_id.split('.')[0]
on_dev = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')
server_port = os.environ.get('SERVER_PORT', '8080')

if on_dev:
    base_url = 'http://localhost:%s' % server_port
elif 'dev' in version_id:
    base_url = 'http://%s.techno-is-the-word.appspot.com' % version_id
else:
    base_url = 'http://techno-is-the-word.appspot.com'


# ------------------------------------------------------------
SECONDS = 1
MINUTES = 60 * SECONDS
HOURS = 60 * MINUTES

SETTINGS = {
    'ON_DEV': on_dev,
    'BASE_URL': base_url,

    'MEMCACHE_SHORT': (5 * MINUTES),
    'MEMCACHE_LONG': (1 * HOURS),
    'MEMCACHE_DAY': (24 * HOURS),

    'DJANGO_VER': '1.2',
    'APP_ID': application_id,
    'APP_FULL_VERSION_ID': full_version_id,
    'APP_VERSION_ID': version_id
}
