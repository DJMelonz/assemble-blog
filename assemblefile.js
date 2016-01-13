var assemble = require('assemble');
var del = require('delete');
var extname = require('gulp-extname');

/**
 * Create our assemble appplication
 */

var app = assemble();

/**
 * Create an instance of assemble
 */

app.create('pages');
app.create('posts');

/**
 * Load helpers
 */

app.helpers('src/helpers/*.js');

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
 * Middleware
 */

app.preLayout(/\.md$/, function(view, next) {
    if (!view.layout) {
        view.layout = 'markdown';
    }
  next();
});

/**
 * Clean out the dist directory
 */

app.task('clean', function(cb) {
  var pattern = 'dist';
  del(pattern, {force: true}, cb);
});

/**
 * Load templates
 */

app.task('load', function (cb) {
    app.partials('src/templates/partials/*.hbs');
    app.layouts('src/templates/layouts/*.hbs');
    app.pages('src/content/pages/*.{md,hbs}');
    app.posts('src/content/posts/*.{md,hbs}');
    
    cb();
});

/**
 * Generate site
 */

app.task('content', ['load', 'pages', 'posts']);

function renderContent(stream, dist) {
    return stream
        .on('err', console.log)
        .pipe(app.renderFile())
        .on('err', console.log)
        .pipe(extname())
        .pipe(app.dest(dist));
}

app.task('pages', function () {
    var stream = app.toStream('pages');
    return renderContent(stream, 'dist');
});

app.task('posts', function () {
    var stream = app.toStream('posts');
    return renderContent(stream, 'dist/blog');
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
