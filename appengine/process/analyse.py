import logging
from models.status import set_status

# ============================================================
def morph_tempo(offset):
    if offset < 10:
        offset = 10 + (offset / 2)
    elif offset > 30:
        offset = 30 + ((offset - 30) / 2)
    return offset

def calc_tempo(w):
    scrabble = w.get('scrabble', 2)
    hairy = w.get('hairyness', 3)
    vowels = w.get('vowels', 5)
    consonents = w.get('consonents', 8)
    ascii = w.get('ascii', 12)

    offset = scrabble + hairy + vowels + consonents + ascii

    offset %= 60

    offset = morph_tempo(offset)

    # BPM
    tempo = 105 + offset
    w.set('tempo', tempo)

    # 44100 samples per second.
    # Thus 44100 * 60 samples per minute.
    # Thus (44100 * 60) / BPM samples per beat.
    samples_beat = (44100 * 60) / tempo
    w.set('samples_beat', samples_beat)

    return 'tempo:\n%i' % tempo


# ============================================================
def analyse(w, state):
    word = w.word()

    logging.info('ANALYSING %s [%i]' % (word, state))

    if state < 2:
        import wordplay
        txt = wordplay.scores(w)
        state = 2
    elif state < 10:
        txt = calc_tempo(w)
        state = 10

    set_status(word, state, txt)
