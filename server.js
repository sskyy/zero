const webpack = require('webpack')
const webpackDevMiddleware = require('koa-webpack-dev-middleware')
const webpackHotMiddleware = require('koa-webpack-hot-middleware')
const config = require('./webpack.config')
const Koa = require('koa')
const app = new Koa()
const port = 3000

const route = require('koa-route');
const bodyParser = require('koa-bodyparser');
const sendFile = require('koa-sendfile')
const convert = require('koa-convert')
app.use(bodyParser());

// route
// app.use(route.get('/',function*(ctx){
//     yield sendFile(ctx, __dirname + '/index.html')
// }))
//
// app.use(route.get('/api',function*(ctx){
//   console.log('calling api', JSON.stringify(ctx.request.body))
//   ctx.body = 'api'
// }))

app.use(async function(ctx, next){
  if( ctx.request.path === '/'){
    await sendFile(ctx, __dirname + '/index.html')
  }else if(ctx.request.path === '/api'){
    console.log('state', JSON.stringify(ctx.request.body))
    ctx.body = {
      action:{
        payload:{
          state:{
            name:'Wayne',
            friends: [
              {name:'John',age:12}
              ]
          }
        }
      }
    }
  }else{
    await next()
  }
})

// webpack
const compiler = webpack(config)
app.use(convert(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath })))
app.use(convert(webpackHotMiddleware(compiler)))

// listen
app.listen(port, function(error) {
  if (error) {
    console.error(error)
  } else {
    console.info("==>  Listening on port %s. Open up http://localhost:%s/ in your browser.", port, port)
  }
})
