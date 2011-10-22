import view
from imports import *
from lib.helpers import cleanse_word

from django.utils import simplejson
import urllib


# ============================================================
def status(word, last_state):
    word = cleanse_word(word)

    if not word:
        logging.error('NON WORD requested status')
        return None

    if not last_state:
        last_state = -1

    # Look up word, return existing status if available.
    # Start processing of word if it's new.

    actual_state = 2

    if last_state >= actual_state:
        # No change.
        return False

    status = {
        'word': word,
        'state': actual_state,
        'txt': ['thinking...', 'reticulating\nsplines...', 'activating\nstrobes...',
                'quantizing\nbeats...', 'wobbling\nwoofers...']
        }

    return status


# ============================================================
class Status(view.Handler):
    def handle(self, word):
        word = urllib.unquote(word)

        result = status(word, self.request.get('state'))
        if result == None:
            # Bad word.
            return self.response.set_status(404)
        elif result == False:
            # No change.
            return self.response.set_status(304)
        else:
            self.response.out.write(simplejson.dumps(result))

    def post(self, word):
        return self.handle(word)

    def get(self, word):
        return self.handle(word)
