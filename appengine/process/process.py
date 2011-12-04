from imports import *
from models import *

import analyse
import generate

from google.appengine.ext import deferred


# ============================================================
def process(clean_word):
    w, new = word.get_word(clean_word)
    if w.completed():
        logging.info('Processing COMPLETED for %s' % clean_word)
        return

    state = status.get_latest_state(clean_word)

    logging.info('PROCESSING %s [%i]' % (w.word(), state))

    # Dispatch word to appropriate processing stage.
    if state < 10:
        analyse.analyse(w, state)
    elif state < 20:
        generate.generate(w, state)
    else:
        # Completion state!
        state = 808


    # Persist latest word payload if needed.
    w.persist_payload()

    # Queue up next processing step if required.
    if not w.completed():
        deferred.defer(process, clean_word)


# ============================================================
def process_deferred(clean_word):
    deferred.defer(process, clean_word)
