var gulp = require('gulp');
var gulpif = require('gulp-if');
var $ = require('gulp-load-plugins')();
var del = require('del');
var webpack = require('webpack');
var minifyCss = require('gulp-minify-css');
var argv = require('yargs').argv;
var tslint = require('gulp-tslint')

gulp.task('clean', function(cb) {
    del([
        'dist/**/*.*'
    ], cb);
});

gulp.task('html', function() {
    return gulp.src('src/index.html')
        .pipe($.plumber())
        .pipe(gulp.dest('dist'));
});

gulp.task('fonts', function() {
    gulp.src('./node_modules/font-awesome/fonts/**/*.{ttf,woff,woff2,eof,svg}')
        .pipe(gulp.dest('./dist/fonts'));
});

gulp.task('images', function() {
    gulp.src('./src/img/**/*.*')
        .pipe(gulp.dest('./dist/img'));
});

var prepareForProduction = argv.production;

gulp.task('styles', ['fonts', 'images'], function() {
    return gulp.src('src/main.less')
        .pipe($.less())
        .pipe($.autoprefixer())
        .pipe($.rename('style.css'))
        .pipe($.sourcemaps.init({ loadMaps: true }))
        .pipe(gulpif(prepareForProduction, minifyCss()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('tslint', function(){
    return gulp.src(['src/**/*.ts'])
        .pipe($.plumber())
        .pipe(tslint())
        .pipe(tslint.report('verbose', {
            emitError: false
        }));
});

gulp.task('scripts', ['tslint'], function(cb) {
    var plugins = [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/) //Do not include moment.js locales
    ];
    if (prepareForProduction) {
        plugins.push(new webpack.optimize.UglifyJsPlugin({
            minimize: true
        }));
    }
    webpack({
        entry: './src/main.ts',
        output: {
            path: 'dist',
            filename: 'app.js'
        },
        resolve: {
            extensions: ['', '.hbs', '.ts', '.webpack.js', '.web.js', '.js']
        },
        module: {
            loaders: [
                {
                    test: /\.hbs$/,
                    exclude: /node_modules/,
                    loader: 'handlebars-loader'
                },
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    loader: 'awesome-typescript-loader?compiler=ntypescript&emitRequireType=false&library=es6&module=commonjs'
                }
            ]
        },
        plugins: plugins,
        devtool: '#source-map'
    }, function (err, stats) {
        if (err) {
            cb(new $.util.PluginError('webpack', err));
            return;
        }
        $.util.log('[webpack]', stats.toString({}));
        cb();
    });
});

gulp.task('mocha', function() {
    return gulp.src([
        'test/unit/*.js'
    ], { read: false })
        .pipe($.plumber())
        .pipe($.mocha({ reporter: 'spec' }));
});

gulp.task('build', [
    'clean',
    'html',
    'styles',
    'scripts',
    'test'
]);

gulp.task('test', ['mocha']);

gulp.task('default', ['build']);