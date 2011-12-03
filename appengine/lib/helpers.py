# ============================================================
def cleanse_word(word):
    if not word:
        return

    word = unicode(word, errors = 'ignore')

    import re, unicodedata
    value = unicodedata.normalize('NFKD', word).encode('ascii', 'ignore')
    value = unicode(re.sub('[^\w\s\!\.\,\:\-\=]', '', value).strip().lower())
    return value


# ============================================================
def dbg():
    import pdb, sys
    pdb.Pdb(stdin=getattr(sys,'__stdin__'),
            stdout=getattr(sys,'__stderr__')).set_trace(sys._getframe().f_back)


# ============================================================
def alter_query(url, param_dict):
    if not param_dict:
        return url

    from urllib import urlencode
    from urlparse import urlparse, urlunparse
    from cgi import parse_qsl

    bits = urlparse(url)
    qdict = parse_qsl(bits.query)
    qdict = [v for v in qdict if v[0] not in param_dict]
    for k, v in param_dict.items():
        if v:
            qdict.append((k, v))
    newqs = urlencode(qdict)
    altered = (bits.scheme, bits.netloc, bits.path, bits.params, newqs, bits.fragment)
    url = urlunparse(altered)
    return url
