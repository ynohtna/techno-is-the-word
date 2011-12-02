from imports import *
import view

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
class List(view.Handler):
    def get(self):
        from models.word import all_words
        words = all_words(self.request.get('sort') == 'alpha')

        values = self.default_values()
        values['words'] = words

        self.render('admin/list.html', values)
