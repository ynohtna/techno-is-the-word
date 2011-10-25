import view
from imports import *

from lib.helpers import cleanse_word
from models import *

from process.process import process_deferred

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
    else:
        try:
            last_state = int(last_state)
        except:
            last_state = -1

    if last_state >= 0 and not status.has_fresh_state(clean_word, last_state):
        logging.info('State UNCHANGED for %s [%i]' % (clean_word, last_state))
        return False

    # Look up word and it's associated status.
    w, new = word.get_word(clean_word)
    if not w:
        logging.error('FAILED to get_word %s' % clean_word)
        return None

    result = None
    if w.completed():
         result = w.result_url()

    actual_state = 0
    txt = []

    if not new:
        statuses = status.get_status(clean_word, last_state)
        if statuses:
            for s in statuses:
                logging.info('%i: %s' % (s.state, s.txt))
                for t in s.txt:
                    txt.append(t)
                actual_state = s.state
    else:
        # Kick off processing.
        txt = ['working...']
        process_deferred(clean_word)

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
