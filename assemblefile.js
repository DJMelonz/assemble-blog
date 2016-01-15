'use strict';

var path = require('path');
var merge = require('mixin-deep');
var assemble = require('assemble');
var permalinks = require('assemble-permalinks');
var del = require('delete');
var prettify = require('gulp-prettify');
var extname = require('gulp-extname');

/**
 * Create our assemble appplication
 */

var app = assemble();

/**
 * Plugins
 */

function viewEvents(eventName) {
    var method = 'on'
        + eventName.charAt(0).toUpperCase()
        + eventName.slice(1);

    return function (app) {
        app.handler(method);
        app.use(function (app) {
            return function (views) {
                return function () {
                    this.on(eventName, function (view) {
                        app.emit(eventName, view);
                        app.handle(method, view);
                    });
                };
            };
        });
    };
}

app.use(viewEvents('permalink'));
app.use(permalinks());

app.onPermalink(/./, function (file, next) {
    file.data = merge({}, app.cache.data, file.data);
    next();
});

/**
 * 
 */

app.create('pages');
app.create('posts', {
    renameKey: function (key, view) {
        return view ? view.basename : path.basename(key);
    }
});

app.pages.use(permalinks(':site.base/:filename.html'));
app.posts.use(permalinks(':site.base/blog/:filename.html'));

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
        base: 'dist',
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
    app.layouts('src/templates/layouts/*.hbs');
    app.partials('src/templates/partials/*.hbs');
    app.pages('src/pages/*.{md,hbs}');
    app.posts('src/posts/*.{md,hbs}');

    cb();
});

/**
 * Generate site
 */

app.task('content', ['load'], function () {

    return app.toStream('pages')
        .pipe(app.toStream('posts'))
        .on('err', console.log)
        .pipe(app.renderFile())
        .on('err', console.log)
        .pipe(prettify())
        .pipe(extname())
        .pipe(app.dest(function (file) {
            file.path = file.data.permalink;
            file.base = path.dirname(file.path);
            return file.base;
        }));
});

/**
 * Pre-process Assets
 * TODO: Update once using scss & es2015
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
