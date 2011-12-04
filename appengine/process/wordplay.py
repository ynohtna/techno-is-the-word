_scores = {
    # Scrabble, vowel, consonent, punctuation, strokes, hairy
    'a': (1, 1, 0, 0,  0, 1),
    'b': (3, 0, 1, 0,  0, 1),
    'c': (3, 0, 1, 0,  0, 1),
    'd': (2, 0, 1, 0,  0, 1),
    'e': (1, 1, 0, 0,  0, 1),
    'f': (4, 0, 0, 0,  0, 3),
    'g': (2, 0, 1, 0,  0, 1),
    'h': (4, 0, 1, 0,  0, 1),
    'i': (1, 1, 0, 0,  0, 2),
    'j': (8, 0, 1, 0,  0, 2),
    'k': (5, 0, 1, 0,  0, 4),
    'l': (1, 0, 1, 0,  0, 1),
    'm': (3, 0, 1, 0,  0, 3),
    'n': (1, 0, 1, 0,  0, 2),
    'o': (1, 1, 0, 0,  0, 0),
    'p': (3, 0, 1, 0,  0, 1),
    'q': (10, 0, 1, 0, 0, 1),
    'r': (1, 0, 1, 0,  0, 2),
    's': (1, 0, 1, 0,  0, 1),
    't': (1, 0, 1, 0,  0, 4),
    'u': (1, 1, 0, 0,  0, 2),
    'v': (4, 0, 1, 0,  0, 1),
    'w': (4, 0, 1, 0,  0, 1),
    'x': (8, 0, 1, 0,  0, 4),
    'y': (4, 0, 1, 0,  0, 3),
    'z': (10, 0, 1, 0, 0, 1),
    ' ': (0, 0, 0, 1,  0, 0),
    '!': (0, 0, 0, 1,  0, 2),
    '.': (0, 0, 0, 1,  0, 1),
    ',': (0, 0, 0, 1,  0, 1),
    ':': (0, 0, 0, 1,  0, 2),
    ';': (0, 0, 0, 1,  0, 2),
    '-': (0, 0, 0, 1,  0, 1),
    '=': (0, 0, 0, 1,  0, 2)
}


# ============================================================
import math

def scores(w):
    word = w.word()
    sums = (0, 0, 0, 0, 0, 0)

    ascii_sum = 0

    prior = ord('z')
    prior_diff = 128
    rngs = []

    for kar in word:
        idx = ord(kar)
        ascii_sum += idx

        rngs.append(idx)
        diff = int(math.fabs(idx - prior))
        rngs.append(diff)
        rngs.append(diff - prior_diff)
        prior = idx
        prior_diff = diff

        if kar not in _scores:
            logging.warn('UNKNOWN KAR %s!' % kar)
            continue
        sums = tuple(sum(t) for t in zip(sums, _scores[kar]))

        rngs.append(sums[0] - idx + sums[5])
        rngs.append(((sums[2] - prior_diff) * diff))

    scrabble_bonus = 0
    scrabble_mult = 1
    if len(word) > 8:
        scrabble_bonus = 30
    if len(word) > 5:
        scrabble_mult = 2

    scrabble_score = (sums[0] * scrabble_mult) + scrabble_bonus

    w.set('ascii', ascii_sum)
    w.set('scrabble', scrabble_score)
    w.set('vowels', sums[1])
    w.set('consonents', sums[2])
    w.set('hairyness', sums[5])

    w.rngvec = rngs

    logs = ['scrabble\nscore: %i' % scrabble_score,
            'hairyness:%i\n' % sums[5],
            'vowel ratio:\n%i:%i' % (sums[1], sums[2])
            ]
    return logs
