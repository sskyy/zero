/**
 * Theme 模块
 * ==========
 *
 * 配置项示例：
 * theme : {
 *  directory : 'themes/default',                        //模块下主题文件夹的相对路径
 *  locals : {                                           //使用服务器端渲染页面是，可以用这个手动选项来页面需要的服务器端数据
 *    user : {                                           //键名就是相应模板页面的名字，值就是需要渲染的数据
 *       name :  'jiamiu'
 *      }
 *    }
 * }
 *
 * 页面渲染规则：
 * theme 模块会在路由层面监听 `/模块名/view/*` 这个路由。如twenty声明了依赖theme模块，那theme就会监听 `/twenty/view/*`。
 * 在路由回调函数里，theme 会检测路径的后半部分(如/twenty/view/user/1，后半部分指定就是 user/1)是否匹配以下几个规则:
 *   1. 是否和某个 model 的路径匹配
 *   2. 是否和主题文件夹下的某个 ejs 或 jade 文件匹配
 *   3. 是否和主题文件夹下某个 文件匹配
 *
 * 满足1，theme 会主动去调用监听路径后半部分的回调函数，例如调用本来监听 /user/1 这个路径的回调函数。然后找到名为 user.jade
 *  或 user.ejs 的模班进行渲染，默认将 bus.data('respond') 作为渲染数据传入。
 *
 * 满足2， theme 将直接渲染相应页面，同时去配置项中的 locals 去找有没有相应地数据或函数，如果有则传入。
 *
 * 满足3， theme直接将文件作为静态资源输出。
 */


var path = require('path'),
  q = require('q'),
  _ = require('lodash'),
  fs = require('fs'),
  appUrl  = path.join(__dirname, "../")

function walk(dir, filter) {
  var results = [];
  var list = fs.readdirSync(dir)

  list.forEach(function(file) {
    file = dir + '/' + file;
    var stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file, filter));
    } else {
      filter( file ) && results.push(file);
    }
  });
  return results
};

function fill( length, initial ){
  return Array.apply(null, new Array(length)).map(function(){ return initial})
}

function findExtension( collection, exts, item){
  return _.find( exts, function( ext ){ return collection[item+"."+ext]})
}

module.exports = {
  deps : ['request','statics','config','model'],
  config : {
    'prefix' : '/view',
    'engines'  : ['ejs','jade'],
    'omitModule' : false
  },
  cache : {},
  expand : function( module ){
    if( !module.theme ) return false

    var root = this,
      matchRoute = root.config.omitModule ? root.config.prefix : path.join("/"+module.name, root.config.prefix) + "/",
      themePath = path.join('modules',module.name, module.theme.directory )

    root.cache[module.name] = {}

    //serve all files in this directory as template, using default conventions
    root.route = root.route || {}

    //cache all files
    var pages = walk(path.join(appUrl, themePath), function( f){ return _.indexOf(root.config.engines, f.split(".").pop()) !== -1}),
      statics = walk( path.join(appUrl, themePath), function(f){ return _.indexOf(root.config.engines, f.split(".").pop()) == -1 })
    root.cache[module.name] = {
      page: _.zipObject( pages,  fill(pages.length, true)),
      statics:_.zipObject( statics,  fill(statics.length, true))
    }

//    console.log("[THEME] cache",themePath, JSON.stringify( root.cache, null, 4))
    console.log("[THEME] route",matchRoute)

    var reqHandler =  function( req, res, next ){
      var restRoute = {
          url:req.path.replace( matchRoute , ""),
          method : req.param('_method') || undefined
        },
        cachePath = path.join( appUrl, themePath, restRoute.url),
        extension

      console.log(console.log("[THEME] handler",restRoute.url, cachePath) )

      if( root.dep.model.models[restRoute.url.split("/")[0]] !== undefined ){
        console.log("[THEME] find model match", restRoute)

        //1. check if current view route match any model api
        root.dep.request.triggerRequest( "/"+restRoute.url, restRoute.method , req, res, function(){})

        //all done
        req.bus.then(function(){
          console.log("[THEME]  model action done", restRoute.url)

          //TODO find the right view file
          var i, templateName, templatePath, tmp = restRoute.url.split("/")
          for( i = tmp.length;i>0; i--){
            templateName = tmp.slice(0,i).join('-')
            templatePath = path.join( appUrl, themePath, templateName)
            extension = findExtension(root.cache[module.name].page,root.config.engines,templatePath )
            if( extension ) break;
          }

          if( extension ){
            console.log("[THEME] find template", templateName, extension,req.bus.data('respond'))
            res.render( path.join( themePath, templateName+'.'+extension), req.bus.data('respond'))
          }else{
            console.log("[THEME] can't find template", templateName, extension)
            next()
          }
        }).fail(function(err){
          console.log("err",err)
        })

      }else if( extension = findExtension(root.cache[module.name].page,root.config.engines,cachePath )){
        //2. check if current view route match any page
        console.log("[THEME] find view page match", restRoute.url, extension)

        if(  module.theme.locals && module.theme.locals[restRoute.url]){
          if(_.isFunction(module.theme.locals[restRoute.url])){
            module.theme.locals[restRoute.url]( req, res )
            req.bus.then(function(){
              res.render( path.join( themePath, restRoute.url) + "." +extension, req.bus.data('respond') )
            })
          }else{
            res.render( path.join( themePath, restRoute.url) + "." +extension, module.theme.locals[restRoute.url] )
          }
        }else{
          res.render( path.join( themePath, restRoute.url) + "." +extension,{})
        }

      }else if( root.cache[module.name].statics[cachePath] ){
        //3. check if current view route match any static files
        console.log("[THEME] find statics match", restRoute.url)

        res.sendFile( cachePath )
      }else{
        console.log("[THEME] cannot find any match")
        next()
      }
    }

    root.dep.request.add( matchRoute + "*",reqHandler )
  }
}

