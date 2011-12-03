import struct, wave


# ============================================================
def alternate(a, offset = 0):
    return [a[i] for i in range(offset, len(v), 2)]


# ============================================================
def normalized_wav(fp):
    wav = wave.open(fp)
    (nchannels, sampwidth, framerate, nframes, comptype, compname) = wav.getparams()
    frames = wav.readframes(nframes * nchannels)

    out = struct.unpack_from('%dh' % nframes * nchannels, frames)

    if nchannels == 2:
        left = array(list(alternate(out, 0)))
        right = array(list(alternate(out, 1)))
    else:
        left = array(out)
        right = left

    return {
        'properties': (nchannels, sampwidth, framerate, nframes, comptype, compname),
        'left': left,
        'right': right
        }
