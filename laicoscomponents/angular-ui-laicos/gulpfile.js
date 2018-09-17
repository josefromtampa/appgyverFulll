var gulp = require('gulp'),
	path = require('path'),
	del = require('del'),
	sequence = require('gulp-sequence'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	minHtml = require('gulp-minify-html'),
	templateCache = require('gulp-angular-templatecache')

var srcPath = './src',
	tmpPath = './.tmp'

gulp.task('build', sequence('clean', 'jsMin', 'htmlMin', 'concat'))

gulp.task('jsMin', function() {
	return gulp.src([
		path.join(srcPath, '**/*.js')
	])
		.pipe(uglify())
		.pipe(concat('jsmin.js'))
		.pipe(gulp.dest(tmpPath))
})

gulp.task('htmlMin', function() {
	return gulp.src([
		path.join(srcPath, '**/*.html')
	])
		.pipe(minHtml({
			empty: true
		}))
		.pipe(templateCache({
			module: "laicos.ui.templates"
		}))
		.pipe(gulp.dest(tmpPath))
})

gulp.task('concat', function() {
	return gulp.src([
		path.join(tmpPath, '**/*.js')
	])
		.pipe(concat('angular-ui-laicos.js'))
		.pipe(gulp.dest('./'))
})

gulp.task('clean', function(cb) {
	del([
		'./angular-ui-laicos.js',
		tmpPath
	], function (err, deletedFiles) {
		if (err) {
			console.error(err)
		}
		cb()
	})
})