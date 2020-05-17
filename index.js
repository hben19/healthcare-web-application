const express = require('express');
const flash =require('express-flash')
const session = require('express-session');
const path = require('path');
const pageRouter = require('./routes/pages');
const app = express();
const port = 8000;
const expressSanitizer = require('express-sanitizer');
app.locals.moment = require('moment');

////////////////////////
// Express web server //
//require('./routes/main')(app);

// serve static files.
app.use(express.static(path.join(__dirname, 'public')));

//template engines
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.engine('html', require('pug').renderFile);

// initailize express-flash for error handling
app.use(flash());

//session
app.use(session({
    secret: 'medicode',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 1000 * 30
    }
}));

// for body parser
app.use(express.urlencoded({ extended: false }));

// Expres sanitize
app.use(expressSanitizer());

// routers
app.use('/', pageRouter);

//ERROR MESSAGES
// page not found
app.use((req, res, next) => {
    var err = new Error('Page not found');
    err.status = 404;
    next(err);
})

// handling error
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send(err.message);
});

//setting up the server
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

module.exports = app;
