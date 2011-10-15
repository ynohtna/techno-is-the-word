import view

# ============================================================
class HomePage(view.Handler):
    def get(self):
        values = self.default_values()

        self.render('home.html', values)
