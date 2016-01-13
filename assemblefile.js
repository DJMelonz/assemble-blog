var assemble = require('assemble');
var del = require('delete');
var prettify = require('gulp-prettify');
var extname = require('gulp-extname');

/**
 * Create our assemble appplication
 */

var app = assemble();

/**
 * 
 */

app.create('pages');
app.create('contents');

/**
 * Load helpers
 */

app.helpers('src/helpers/*.js');

/**
 * Set default layout (if none is specified)
 */

app.option('layout', 'default');

/**
 * Add some basic site data (passed to templates)
 */

app.data({
    site: {
        title: 'DamianMullins.co.uk',
        author: 'Damian Mullins'
    }
});

/**
 * Middleware
 */

app.preLayout(/\.md$/, function (view, next) {
    if (!view.layout) {
        view.layout = 'markdown';
    }
    next();
});

/**
 * Clean out the dist directory
 */

app.task('clean', function (cb) {
    var pattern = 'dist';
    del(pattern, { force: true }, cb);
});

/**
 * Load templates
 */

app.task('load', function (cb) {
    var pkg = require('./package');
    console.log('Loading v', pkg.version);

    app.partials('src/templates/partials/*.hbs');
    app.layouts('src/templates/layouts/*.hbs');
    app.pages('src/templates/pages/*.{md,hbs}');
    app.contents('src/content/**/*.{md,hbs}');

    cb();
});

/**
 * Generate site
 */

app.task('content', ['load'], function () {

    return app.toStream('pages')
        .pipe(app.toStream('contents'))
        .on('err', console.log)
        .pipe(app.renderFile())
        .on('err', console.log)
        .pipe(prettify())
        .pipe(extname())
        .pipe(app.dest('dist'));
});

/**
 * Pre-process Assets
 */

app.task('assets', function () {
    return app.copy('src/assets/**/*', 'dist/assets/');
});

/**
 * Default task
 */

app.task('default', ['clean', 'assets', 'content']);

/**
 * Expose the assemble instance
 */

module.exports = app;
