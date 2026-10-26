require('dotenv').config();

const express = require('express');
const path = require('path');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');
const webRoutes = require('./routes/webRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestLogger);

app.use('/', webRoutes);
app.use('/api', apiRoutes);

app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`SSR is running at http://localhost:${port}`);
  });
}

module.exports = app;
