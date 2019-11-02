const gulp = require('gulp')
const babel = require('gulp-babel')
const plumber = require('gulp-plumber')
const newer = require('gulp-newer')
const through = require('through2')
const log = require('fancy-log')
const chalk = require('chalk')
const relative = require('path').relative
const del = require('del')

const src = 'packages/*/src/**/*.js'
const lib = 'packages/*/lib'
const dest = 'packages/'
let watching = false

function exclude (rx) {
  return through.obj((file, enc, cb) => {
    if (rx.test(file.path)) {
      cb(null)
    } else {
      cb(null, file)
    }
  })
}

function rename (from, to) {
  return through.obj((file, enc, cb) => {
    file.origPath = file.path
    file.path = file.path.replace(from, to)
    cb(null, file)
  })
}

function logCompiling () {
  return through.obj((file, enc, cb) => {
    const inpath = relative(__dirname, file.origPath)
    const outpath = relative(__dirname, file.path)
    log(`Compiling '${chalk.cyan(inpath)}' to '${chalk.cyan(outpath)}'...`)
    cb(null, file)
  })
}

function clean () {
  return del(lib)
}

function build () {
  return gulp.src(src)
    .pipe(watching ? plumber() : through.obj())
    .pipe(exclude(/__tests__/))
    .pipe(rename(/packages\/(.*?)\/src\//, 'packages/$1/lib/'))
    .pipe(newer(dest))
    .pipe(logCompiling())
    .pipe(babel())
    .pipe(gulp.dest(dest))
}

function watchTask () {
  watching = true
  gulp.watch(src, build)
}

exports.clean = clean
exports.build = build
exports.watch = gulp.series(watchTask, build)
exports.default = build
exports.prepublish = gulp.series(clean, build)
