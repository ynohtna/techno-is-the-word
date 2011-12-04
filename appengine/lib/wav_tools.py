from __future__ import with_statement
import struct, wave

from lib.helpers import dbg


# ============================================================
def mix_em(a, b):
    return [sum(pair) * 0.5 for pair in zip(a, b)]

# ============================================================
def normalized_wav(fp):
    wav = wave.open(fp)
    (nchannels, sampwidth, framerate, nframes, comptype, compname) = wav.getparams()
    frames = wav.readframes(nframes * nchannels)

    out = struct.unpack_from('%dh' % nframes * nchannels, frames)

    if nchannels == 2:
        left = out[0::2]
        right = out[1::2]
        mono = mix_em(left, right)
    else:
        mono = out

    if sampwidth == 1:
        samp_divisor = 255
    elif sampwidth == 2:
        samp_divisor = 32768
    else:
        raise 'UNEXPECTED SAMPLE SIZE!'

    total_divisor = 1.0 / samp_divisor
    mono = [v * total_divisor for v in mono]

    return {
        'properties': (nchannels, sampwidth, framerate, nframes, comptype, compname),
        'mono': mono
        }


# ============================================================
def write_wav(samples):
    '''Samples are assumed to be in -1 to 1 range and mono, 44100 Hz.
Returns key of newly created blob.'''

    return

    from google.appengine.api import files
    file_name = files.blobstore.create(mime_type = 'application/octet-stream')

    bytes = [struct.pack('h', v * 32767) for v in samples]
    byte_str = ''.join(bytes)

    # Write wav data into a stringIO
    import StringIO
    buffer = StringIO.StringIO()

    wav = wave.open(buffer, 'wb')
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(44100)

    wav.writeframes(byte_str)

    wav.close()

    with files.open(file_name, 'a') as f:
        f.write(buffer)

    files.finalize(file_name)

    blob_key = files.blobstore.get_blob_key(file_name)
    return blob_key
