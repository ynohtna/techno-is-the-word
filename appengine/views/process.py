import view
from imports import *

from lib.helpers import cleanse_word
from models import *

from django.utils import simplejson
import urllib


# ============================================================
def status_update(input_word, last_state):
    clean_word = cleanse_word(input_word)

    if not clean_word:
        logging.error('BAD WORD %s requested status' % input_word)
        return None

    if not last_state:
        last_state = -1

    # Do a fast in-memory cache check against the word's
    # last reported state, returning False if unchanged.

    # Look up word and it's associated status.
    w = word.get_word(clean_word)
    if not w:
        logging.error('FAILED to get_word %s' % clean_word)
        return None

    result = None
    if w.result:
         result = '/result/%s' % clean_word

    actual_state = 0
    txt = ['thinking...']

    statuses = status.get_status(w, last_state)
    if statuses:
        # Unpack new text messages.
        # Update in-memory status cache.
        pass

    if last_state >= actual_state:
        # No change.
        return False

    response = {
        'word': clean_word,
        'state': actual_state,
        'result': result,
        'txt': txt
        }

    return response


# ============================================================
class Status(view.Handler):
    def handle(self, word):
        word = urllib.unquote(word)

        output = status_update(word, self.request.get('state'))

        if output == None:
            # Bad word.
            return self.response.set_status(404)
        elif output == False:
            # No change.
            return self.response.set_status(304)
        else:
            self.response.out.write(simplejson.dumps(output))

    def post(self, word):
        return self.handle(word)

    def get(self, word):
        return self.handle(word)
