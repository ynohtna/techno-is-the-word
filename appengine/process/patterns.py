from lib import cfg
from lib.memcash import cash
from lib.helpers import dbg


# ============================================================
def get_kick_cfg():
    kick_rules = """
SECTION -> MEASURE MEASURE MEASURE MEASURE
MEASURE -> B4 | B2 B2 | B1 B1 B1 B1 | B2 B1 B1 | B1 B2 B1 | B1 B1 B2

B4 -> X...X...X...X...
B4 -> X...X...X...X...
B4 -> X...X...X...X.x.
B4 -> X.x.X...X.x.X.x.
B4 -> X.x.X...X.x.X...
B4 -> X...x.x.....X...
B4 -> X...X.....x.X...
B4 -> X...X.x...x.X...
B4 -> X.........x.....
B4 -> X.....x...x.....
B4 -> X.....x....x....
B4 -> X..........x....

B2 -> X...X...
B2 -> X...x...
B2 -> X..x..x.
B2 -> X..X..x.
B2 -> X...x...
B2 -> X.xX..x.
B2 -> X..xX.x.
B2 -> X.xX..x.
B2 -> X.xX.xX.
B2 -> X.Xx.xX.

B1 -> X... | X..x | X.x.
"""
    import StringIO
    c = cfg.ContextFreeGrammar(StringIO.StringIO(kick_rules))

    return c


# ============================================================
def make_kick_patterns(w):
    cfg = get_kick_cfg()

    pat0 = unicode(''.join(cfg.get_expansion('MEASURE')))
    pat1 = unicode(''.join(cfg.get_expansion('MEASURE')))

    w.set('kick_pat0', pat0)
    w.set('kick_pat1', pat1)

    pat0 = pat0.replace('.', ' ').replace('X', '%').replace('x', '~')
    pat1 = pat1.replace('.', ' ').replace('X', '%').replace('x', '~')

    text = 'kick:\n  ' + \
        pat0[:8] + '\n  ' + pat0[9:] + \
        '\n  ' + pat1[:8] + '\n  ' + pat1[9:]
    return text


# ============================================================
def get_snare_cfg():
    snare_rules = """
SECTION -> MEASURE MEASURE MEASURE MEASURE
MEASURE -> B4 | B2 B2 | B1 B1 B1 B1 | B2 B1 B1 | B1 B2 B1 | B1 B1 B2

B4 -> ....X.......X...
B4 -> ....X...-...X...
B4 -> ..-.X...x...X.x.
B4 -> ....X.....x...x.
B4 -> ....X.........X.
B4 -> ..x.X.....-...X.
B4 -> ....X.--.--.X...
B4 -> ....X.-x.-..X...

B2 -> ....X...
B2 -> ....x...
B2 -> ...xX.-.
B2 -> ........
B2 -> ....-...
B2 -> ..-.....
B2 -> ..x.....
B2 -> ......x.
B2 -> ...-Xxx-
B2 -> .--xX.-.

B1 -> X... | .... | ..-. | X.x. | X..- | X.-. | ..x.

"""
    import StringIO
    c = cfg.ContextFreeGrammar(StringIO.StringIO(snare_rules))

    return c


# ============================================================
def make_snare_patterns(w):
    cfg = get_snare_cfg()

    pat0 = unicode(''.join(cfg.get_expansion('MEASURE')))
    pat1 = unicode(''.join(cfg.get_expansion('MEASURE')))

    pat = '%s%s%s%s' % (pat0, pat0, pat0, pat1)

    w.set('sn_pat', pat)

    pat = pat.replace('.', ' ').replace('X', '%').replace('x', '~')

    text = 'snare:\n'
    while len(pat):
        text += '  ' + pat[:8] + '\n'
        pat = pat[8:]

    return text

# ============================================================
def reorder(seq, format = 'abcd'):
    span = len(seq) / 4
    a = seq[0:span]
    filler = '................'[-span:]
    # TODO: create new string from given sequence.

def chain(w, a, b):
    return a + b

def coalesce_and_choose_sounds(w, state):
    rng = w.get_rng(state)
    def rnd(min, max):
        return min + (rng.random() * (max - min))

    chans = []

    # ----------------------------------------
    # Kick.

    k0 = w.get('kick_pat0')
    k1 = w.get('kick_pat1')
    kick = chain(w, k0, k1)
    w.set('chan0', kick)

    from models.sample import Sample
    ks = Sample.choose_random('bd', rng.random(), rng)
    chans.append({
            'bus': 'bd',
            'label': 'bd',
            'hard': 1.0,
            'soft': rnd(0.7, 0.9),
            'grace': rnd(0.01, 0.2),
            'pat': kick,
            'sound': ks.serve_url()
            })

    # ----------------------------------------
    # Snare.

    sn = w.get('sn_pat')
    w.set('chan1', sn)

    ss = Sample.choose_random('sn', rng.random(), rng)
    chans.append({
            'bus': 'sn',
            'label': 'sn',
            'hard': rnd(0.6, 0.9),
            'soft': rnd(0.2, 0.65),
            'grace': rnd(0.1, 0.25),
            'pat': sn,
            'sound': ss.serve_url()
            })

    # ----------------------------------------
    w.set('channels', len(chans))
    w.set_result({
            'bpm': w.get('tempo'),
            'chans': chans
            })

    return 'punching to\ntape...'
