import logging
from models.status import set_status

# ============================================================
def analyse(w, state):
    word = w.word()

    logging.info('ANALYSING %s [%i]' % (word, state))

    if state < 2:
        import wordplay
        txt = wordplay.scores(w)
        state = 10

    set_status(word, state, txt)
