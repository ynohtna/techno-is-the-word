# ------------------------------------------------------------
def cleanse_word(word):
    if not word:
        return

    word = unicode(word, errors = 'ignore')

    import re, unicodedata
    value = unicodedata.normalize('NFKD', word).encode('ascii', 'ignore')
    value = unicode(re.sub('[^\w\s!\.,:-=]', '', value).strip().lower())
    return value

# ============================================================
def dbg():
    import pdb, sys
    pdb.Pdb(stdin=getattr(sys,'__stdin__'),
            stdout=getattr(sys,'__stderr__')).set_trace(sys._getframe().f_back)
