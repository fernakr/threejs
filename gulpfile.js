var gulp          = require('gulp');
const path = require('path');
var browserSync   = require('browser-sync').create();
var webpackStream =require('webpack-stream');
var webpack2      = require('webpack');

var concat = require('gulp-concat');

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
  gulp.watch("src/*.js").on('change', javascript);
  gulp.watch('src/index.html').on('change', browserSync.reload)
  //gulp.watch("library/src/scss/**/*.scss", sass);
  //gulp.watch("*.php").on('change', browserSync.reload);
}


gulp.task('javascript', javascript);
// gulp.task('sass', sass);
// gulp.task('serve', gulp.series('sass',serve));
gulp.task('default', gulp.series('javascript', serve));
