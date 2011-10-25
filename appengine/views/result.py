import view
from imports import *

from lib.helpers import cleanse_word
from models import *


# ============================================================
def result(input_word):
    clean_word = cleanse_word(input_word)

    if not clean_word:
        logging.error('BAD WORD %s requested results' % input_word)
        return None

    # Look up word and it's associated results.
    w, new = word.get_word(clean_word)
    if not w:
        logging.error('FAILED to get_word %s' % clean_word)
        return None

    # TODO: Dereference result blob.

    return '/* ChucK code for %s */' % w.word()


# ============================================================
class Result(view.Handler):
    def handle(self, word):
        word = urllib.unquote(word)

        output = result(word)

        if output == None:
            # Bad word.
            return self.response.set_status(404)
        else:
            self.response.out.write(output)

    def post(self, word):
        return self.handle(word)

    def get(self, word):
        return self.handle(word)
