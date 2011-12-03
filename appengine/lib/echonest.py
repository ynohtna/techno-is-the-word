import logging

from django.utils import simplejson
from google.appengine.api.urlfetch import fetch

from lib.helpers import alter_query


# ============================================================
# CONSTANTS.

API_KEY = 'TCLMMWCPEMTQCMBVA'
CON_KEY = '93a88bc50c2a37f66339cbd35d7bfb66'
SECRET = 'qlJ5i/ZeQjGv5e8cBTjqlQ'

URL = 'http://developer.echonest.com/api/v4'


# ============================================================
def mk_url(api, dict = None):
    url = '%s/%s' % (URL, api)
    params = {
            'api_key': API_KEY,
            'format': 'json'
        }
    if dict:
        params.update(dict)
    url = alter_query(url, params)
    return url


# ============================================================
def test():
    url = mk_url('song')
    logging.info('URL %s' % url)



# ============================================================
def get_assets(limit = 100, offset = 0):
    url = mk_url('sandbox/list', {
            'sandbox': 'emi_open_collection',

            'results': limit,
            'start': offset,
            })

    logging.info('FETCHING ASSETS FROM %s' % url)
    response = fetch(url)

    assets = []
    try:
        if response.status_code == 200:
            json = response.content
            json_dict = simplejson.loads(json)
            assets = json_dict['response']['assets']
    except Exception, e:
        logging.error(repr(e))

    return assets


# ============================================================
def get_techno_tracks(limit = 100, offset = 0):
    url = mk_url('song/search', {
            'style': 'techno',
            'bucket': 'id:emi_open_collection',

            'results': limit,
            'start': offset,
            })

    logging.info('FETCHING TECHNO TRACKS FROM %s' % url)
    response = fetch(url)

    tracks = []
    try:
        if response.status_code == 200:
            json = response.content
            json_dict = simplejson.loads(json)
            tracks = json_dict['response']['songs']
    except Exception, e:
        logging.error(repr(e))

    return tracks
