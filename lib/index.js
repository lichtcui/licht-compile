const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')
const bs = browserSync.create()

// 加载 plugins
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()

// 返回命令行所在的工作目录
const cwd = process.cwd()

let config = {
  // default config
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}

try {
  const loadConfig = require(`${cwd}/licht-compile.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (e) {}

// 自动清除文件
const clean = () => {
  return del([config.build.dist, config.build.temp])
}

// 样式文件编译 gulp-sass
const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

// 脚本文件编译 gulp-babel @babel/core @babel/preset-env
const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

// 页面文件编译 gulp-swig
const page = () => {
  // "src/**/*.html" 任意目录下的 html
  // swig({ data }) 传递指定数据
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

// 图片文件编译 gulp-imagemin
const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

// 文字文件编译
const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

// 其他文件编译
const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

// 热更新开发服务器
const serve = () => {
  // 监视变化
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)

  // image/font 文件修改自动reload
  watch([
    config.build.paths.images,
    config.build.paths.fonts
  ], { cwd: config.build.src }, bs.reload)

  watch('**', { cwd: config.build.public }, bs.reload)

  bs.init({
    notify: false, // 关闭提示
    port: 2080,
    // open: false, // 关闭自动开启
    // 加上 .pipe(bs.reload({ stream: true })) 就不需要 files 属性(监听files文件变化)
    // files: 'dist/**',
    server: {
      // 提高构建效率
      // 一级一级向下查询，上一级找不到文件就去下一级寻找
      baseDir: [config.build.temp, config.build.dist, config.build.public],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    // 文件引用处理
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    // html js css 文件压缩 compile 后 useref
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    // 读写同一个文件可能产生冲突，所以在读取 temp 写入 dist
    .pipe(dest(config.build.dist))
}

// src 目录文件编译
const compile = parallel(style, script, page)

// 上线之前执行的任务
// image, font, extra 不需要再开发阶段编译
const build =  series(
  clean,
  parallel(
    series(compile, useref),
    image,
    font,
    extra
  )
)

const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop
}
