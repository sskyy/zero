const webpack = require('webpack')
const webpackDevMiddleware = require('koa-webpack-dev-middleware')
const webpackHotMiddleware = require('koa-webpack-hot-middleware')
const config = require('./webpack.config')
const Koa = require('koa')
const app = new Koa()
const port = 3000

const sendFile = require('koa-sendfile')
const convert = require('koa-convert')

const compiler = webpack(config)
app.use(convert(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath })))
app.use(convert(webpackHotMiddleware(compiler)))

app.use(function* () {
  yield sendFile(this, __dirname + '/index.html')
  if (!this.status) this.throw(404)
})

app.listen(port, function(error) {
  if (error) {
    console.error(error)
  } else {
    console.info("==> 🌎  Listening on port %s. Open up http://localhost:%s/ in your browser.", port, port)
  }
})
