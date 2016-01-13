var assemble = require('assemble')
var extname = require('gulp-extname');
var browserSync = require('browser-sync').create();
var app = assemble();

/**
 * Create an instance of assemble
 */

app.create('posts');

/**
 * Load helpers
 */

app.helper('markdown', require('helper-markdown'));

// app.option('layout', 'default');

/**
 * Add some basic site data (passed to templates)
 */

app.data({
    site: {
        title: 'My Site'
    }
});

/**
 * Pre-process Assets
 */

app.task('assets', function () {
    return app.src('src/assets/**/*')
        .pipe(app.dest('dist/assets/'))
        .pipe(browserSync.reload({stream: true}));
});

app.task('serve', function () {
});

/**
 * Load templates
 */

app.task('load', function (cb) {
    app.partials('src/templates/partials/*.hbs');
    app.layouts('src/templates/layouts/*.hbs');
    app.posts('src/content/**/*.{md,hbs}');
    // app.data(['src/data/*.json']);
    cb();
});

/**
 * Generate site
 */

app.task('content', ['load'], function () {
    return app.toStream('posts')
        .on('err', console.log)
        .pipe(app.renderFile())
        .on('err', console.log)
        .pipe(extname())
        .pipe(app.dest('dist'));
});

/**
 * Default task
 */

app.task('default', ['assets', 'content'], function() {
    browserSync.init({
        port: 8080,
        startPath: 'index.html',
        server: {
            baseDir: 'dist'
        },
        reloadDelay: 1000
    });
    
    app.watch('src/assets/**/*', ['assets']);
});

/**
 * Expose the assemble instance
 */

module.exports = app;
