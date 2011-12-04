from imports import *
from models import *
from models.status import set_status

import patterns


# ============================================================
# State indices 10 to 20.
def generate(w, state):
    word = w.word()
    logging.info('GENERATING %s' % word)

    if state < 12:
        txt = patterns.make_kick_patterns(w)
        state = 13
    elif state < 14:
        txt = patterns.make_snare_patterns(w)
        state = 14
    elif state < 15:
        txt = patterns.coalesce_and_choose_sounds(w, state)

        state = 808

    set_status(word, state, txt)
