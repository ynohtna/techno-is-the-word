from imports import *
from models import *


# ============================================================
def analyse(w, state):
    logging.info('ANALYSING %s' % w.word())

    txt = 'analysing %i' % state

    state += 1

    status.set_status(w.word(), state, [txt])
