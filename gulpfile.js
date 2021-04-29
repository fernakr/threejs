var gulp          = require('gulp');
var sass          = require('gulp-sass');
const path = require('path');
var browserSync   = require('browser-sync').create();
var webpackStream =require('webpack-stream');
var webpack2      = require('webpack');

var concat = require('gulp-concat');

//sass.compiler = require('dart-sass');


let webpackConfig = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: path.resolve(__dirname, './node_modules/')
      },{
        test: /\.(jpe?g|png|gif|svg|tga|glb|babylon|mtl|pcb|pcd|prwm|obj|mat|mp3|ogg|fbx)$/i,
        use: 'file-loader',
        exclude: path.resolve(__dirname, './node_modules/')
      }
    ]
  }
};


function javascript() {
  return gulp.src("src/*.js")
    .pipe(webpackStream(webpackConfig, webpack2))
    .on('error', (err) => {
      console.log(err.message);
      this.emit('end'); // Recover from errors
    })


    .pipe(concat('entry.js'))    //.pipe(concat('app.js'))
    // .pipe($.sourcemaps.init())
    // .pipe($.if(PRODUCTION, $.uglify()
    //   .on('error', e => { console.log(e); })
    // ))
    // .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest('src/dist'));
}


function serve() {
  browserSync.init({
    server: './src'
  });

  //gulp.watch("app/js/*.js", javascript);
  gulp.watch("src/*.js").on('change', gulp.series(javascript, browserSync.reload));
  gulp.watch('src/index.html').on('change', browserSync.reload)
  gulp.watch("src/**/*.css", css);
  // gulp.watch("src/**/*.scss", sass);
  //gulp.watch("*.php").on('change', browserSync.reload);
}

function sass() {
  return gulp.src('src/*.scss')
    .pipe(sass())
    .on('error', (err) => {
      console.log(err.message);
      //this.emit('end'); // Recover from errors
    })
    .pipe(gulp.dest('src/dist'))
    .pipe(browserSync.stream());
}


function css() {
  return gulp.src('src/*.css')
    //.pipe(sass())
    // .on('error', (err) => {
    //   console.log(err.message);
    //   this.emit('end'); // Recover from errors
    // })
    //.pipe(gulp.dest('src/dist'))
    .pipe(browserSync.stream());
}


gulp.task('javascript', javascript);
gulp.task('sass', sass);
gulp.task('css', css);
// gulp.task('serve', gulp.series('sass',serve));
gulp.task('default', serve);
