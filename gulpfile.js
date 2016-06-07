const gulp = require('gulp')
const babel = require('gulp-babel')
const plumber = require('gulp-plumber')
const watch = require('gulp-watch')
const newer = require('gulp-newer')
const through = require('through2')
const log = require('gulp-util').log
const colors = require('gulp-util').colors
const relative = require('path').relative

const src = 'packages/*/src/**/*.js'
const dest = 'packages/'

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
    log(`Compiling '${colors.cyan(inpath)}' to '${colors.cyan(outpath)}'...`)
    cb(null, file)
  })
}

gulp.task('build', () => {
  return gulp.src(src)
    .pipe(plumber())
    .pipe(rename(/packages\/(.*?)\/src\//, 'packages/$1/lib/'))
    .pipe(newer(dest))
    .pipe(logCompiling())
    .pipe(babel())
    .pipe(gulp.dest(dest))
})

gulp.task('watch', [ 'build' ], () => {
  watch(src, () => {
    gulp.start('build')
  })
})

gulp.task('default', [ 'build' ])
