from imports import *
import view

from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers
from lib.helpers import dbg


# ============================================================
class Flush(view.Handler):
    def delete_all(self, kind, batch_size = 1000):
        from google.appengine.api import datastore
        count = 0
        query = datastore.Query(kind = kind, keys_only = True)
        results = query.Get(batch_size)
        while results:
            datastore.Delete(results)
            count += len(results)
            results = query.Get(batch_size)
        return count

    @view.txtresponse
    def get(self):
        status_count = self.delete_all('Status')
        word_count = self.delete_all('Word')

        from models.status import clear_cache
        clear_cache()

        logging.warn('FLUSHED!')
        return 'Flushed %i words and %i status entries.' % (word_count, status_count)


# ============================================================
class Words(view.Handler):
    def get(self):
        from models.word import all_words
        words = all_words(self.request.get('sort') == 'alpha')

        values = self.default_values()
        values['words'] = words

        self.render('admin/list.html', values)


# ============================================================
class Samples(view.Handler, blobstore_handlers.BlobstoreDownloadHandler):
    def all_samples(self):
        from models.sample import Sample
        return Sample.all().fetch(1000)

    def get_sample(self, id):
        from models.sample import Sample
        return Sample.get_by_id(int(id))

    def get(self, message = None):
        action = self.request.get('action', None)
        if action:
            message = self.do_action(action)

        samples = self.all_samples()

        values = self.default_values()
        values['samples'] = samples
        values['msg'] = message
        values['url'] = '/_ah/nimda/samples'

        self.render('admin/samples.html', values)

    # ------------------------------------------------------------
    def do_del(self, sid):
        s = self.get_sample(sid)
        if s:
            s.data.delete()
            s.delete()
            return "Deleted %s [%s]" % (s.filename, s.type)

        return "Unknown sample ID %s" % sid

    def do_listen(self, sid):
        s = self.get_sample(sid)
        if s:
            return self.send_blob(s.data)

        return "Unknown sample ID %s" % sid

    def do_action(self, action):
        sample = self.request.get('id', None)

        if not sample:
            return "BAD SAMPLE ID!"

        if action == 'del':
            return self.do_del(sample)
        elif action == 'listen':
            return self.do_listen(sample)

        return "Unrecognised action"


# ============================================================
class Upload(view.Handler, blobstore_handlers.BlobstoreUploadHandler):
    def get(self):
        values = self.default_values()

        values['upload_url'] = blobstore.create_upload_url('/_ah/nimda/upload')

        self.render('admin/upload.html', values)

    def post(self):
        logging.info('UPLOADED!')

        upload_files = self.get_uploads('file')
        blob_info = upload_files[0]

        from models.sample import Sample
        s = Sample.new(ip = self.request.remote_addr,
                       type = self.request.get('type', 'unknown'),
                       notes = self.request.get('notes', ''),
                       filename = blob_info.filename,
                       size = blob_info.size,
                       data = blob_info)
        s.put()

        self.redirect('/_ah/nimda/samples')
