# ============================================================
def dbg():
    import pdb, sys
    pdb.Pdb(stdin=getattr(sys,'__stdin__'),
            stdout=getattr(sys,'__stderr__')).set_trace(sys._getframe().f_back)
