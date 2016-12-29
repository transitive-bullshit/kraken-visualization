var browserSync = require('browser-sync')
var gulp        = require('gulp')
var fs          = require('fs')
var s3          = require('./lib/gulp-s3')

// load all plugins
var $ = require('gulp-load-plugins')()

var prefix = 'https://fisch0920.github.io/kraken-visualization/dist/'

function uploadToS3 (files) {
  var conf = JSON.parse(fs.readFileSync('./conf/aws.json'))
  return gulp.src(files)
    .pipe($.gzip())
    .pipe(s3(conf, {
      uploadPath: '/',
      gzippedOnly: true
    }))
}

function browserSyncInit (baseDir, files, browser) {
  browser = (browser === undefined) ? 'default' : browser

  browserSync.instance = browserSync.init(files, {
    startPath: '/index.html',
    server: {
      baseDir: baseDir,
    },
    browser: browser
  })
}

gulp.task('help', $.taskListing)
gulp.task('ls',   $.taskListing)

gulp.task('clean', function () {
  return gulp.src([ 'dist', '.tmp' ], { read: false }).pipe($.clean())
})

gulp.task('build', [ 'html', 'fonts', 'images', 'data' ])

gulp.task('default', [ 'clean' ], function () {
  gulp.start('build')
})

gulp.task('styles', function () {
  return gulp.src('assets/css/*.less')
    .pipe($.less())
    .pipe(gulp.dest('assets/css/'))
    .pipe($.size())
})

gulp.task('scripts', function () {
  return gulp.src([ 'assets/js/**/*.js', '!assets/js/lib/**/*.js'])
    .pipe($.jshint())
    .pipe($.jshint.reporter(require('jshint-stylish')))
    .pipe($.size())
})

gulp.task('partials', function () {
  return gulp.src('assets/html/**/*.html')
    .pipe($.minifyHtml({
      comments: true,
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe($.ngHtml2js({
      moduleName: "kraken",
      prefix: "assets/html/"
    }))
    .pipe(gulp.dest(".tmp/html"))
    .pipe($.size())
})

gulp.task('minify', [ 'styles', 'scripts', 'partials' ], function () {
  var jsFilter  = $.filter('**/*.js')
  var cssFilter = $.filter('**/*.css')

  return gulp.src('index.html')
    .pipe($.inject(gulp.src('.tmp/html/**/*.js'), {
      read: false,
      starttag: '<!-- inject:partials -->',
      addRootSlash: false
    }))
    .pipe($.useref.assets({ searchPath: '.' }))
    .pipe(jsFilter)
    .pipe($.ngmin())
    .pipe($.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.csso())
    .pipe(cssFilter.restore())
    .pipe($.useref.restore())
    .pipe($.useref())
    .pipe(gulp.dest('dist'))
    .pipe($.size())
})

gulp.task('html', [ 'minify' ], function () {
  return gulp.src('dist/index.html')
    .pipe($.prefix(prefix, [
      { match: "script[src]", attr: "src" },
      { match: "link[href]", attr: "href" }
    ]))
    .pipe(gulp.dest('dist'))
})

gulp.task('images', function () {
  return gulp.src([
    'assets/img/**',
  ]).pipe($.filter('**/*.{png,jpg,jpeg,gif}'))
    .pipe(gulp.dest('dist/assets/img'))
    .pipe($.size())
})

gulp.task('fonts', function () {
  return gulp.src([
    'assets/third-party/bootstrap/dist/fonts/*'
  ]).pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest('dist/assets/fonts'))
    .pipe($.size())
})

gulp.task('data', function () {
  return gulp.src([
    'assets/data/**'
  ]).pipe(gulp.dest('dist/assets/data'))
    .pipe($.size())
})

gulp.task('deploy', [ 'build' ], function () {
  return uploadToS3([ './dist/**' ])
})

gulp.task('serve', [ 'styles' ], function () {
  browserSyncInit([
    './',
  ], [
    'assets/**',
    'index.html'
  ])
})

gulp.task('serve:dist', [ 'build' ], function () {
  browserSyncInit('dist')
})

