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

/**
 * @description
 * 为所有依赖该模块并声明了 theme 属性的模块提供主题服务。
 * 当访问的路径为 `/模块名/view/任意名字` 时，主题就开始接管，接管的规则为：
 *
 *   1. 当 `任意名字` 和某个 model 名字相同时，将触发相应的 model 方法，并将 bus.data('respond') 中的数据传给同名模板。
 *   2. 当 `任意名字` 和主题文件夹下的某个模板文件同名时，将直接渲染该模板文件。如果同时在theme.locals中声明一个同名属性，那么会将该属性的值作为数据传给模板。如果改属性值是一个函数，那么将执行该函数，然后将 bus.data('respond') 作为数据传给模板。
 *   3. 当 `任意名字` 和主题文件夹下的某个文件匹配时，直接输出该文件。
 *
 * @module theme
 *
 * @example
 * //theme 字段示例
 * {
 *  directory : 'THEME_DIRECTORY'
 * }
 *
 */
module.exports = {
  deps : ['request','statics','config','model'],
  config : {
    'engines'  : ['ejs','jade'],
    'omitModule' : false,
    'crudMap' : {'get':'list','post':'create','put':'update','delete':'destroy'}
  },
  cache : {},
  /**
   * @param module
   * @returns {boolean}
   */
  expand : function( module ){
    if( !module.theme ) return false

    var root = this,
      matchRoute = path.join("/"+ (root.config.omitModule?"":module.name), (module.theme.prefix?module.theme.prefix:"")) ,
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


    ZERO.mlog("THEME","route",matchRoute)

    var reqHandler =  function( req, res, next ){


      var restRoute = {
          url:req.path.replace( matchRoute , ""),
          method : req.param('_method') || 'get'
        },
        cachePath = path.join( appUrl, themePath, restRoute.url),
        page


      var fireParams = _.extend({},restRoute,{req:req,res:res})

      req.bus.fcall("theme.render", fireParams, function(){
        var bus = this
        if( root.cache[module.name].statics[cachePath] ) {
          //1. check if current view route match any static files
//        ZERO.mlog("THEME","find static file", cachePath)
          bus.data('respond.file', cachePath)

        }else if( root.dep.model.models[restRoute.url.split("/")[1]] !== undefined ){
          //2. check if current view route match any model api
          ZERO.mlog("THEME","find model match", restRoute)

          bus.fire('request.mock', fireParams)

          //Don't return bus.then in `bus.fcall` !!! this may never end.
          console.log("theme bus register!!!!")
          bus.then(function(){
            ZERO.mlog("THEME","model action done", restRoute.url)

            page = root.findPage(root.cache[module.name],restRoute,themePath)

            if( page ){
              ZERO.mlog("THEME","find template", page, bus.data('respond'))
              bus.data('respond.page', page)
            }else{
              ZERO.mlog("THEME"," can't find template", page)
            }
          }).fail(function(err){
            console.log(err)
            ZERO.error(err)
          })

        }else if(page = root.findPage(root.cache[module.name],restRoute,themePath)){
          //3. check if current view route match any page
          ZERO.mlog("THEME"," find view page match", restRoute.url)

          if(  module.theme.locals && module.theme.locals[restRoute.url]){
            if(_.isFunction(module.theme.locals[restRoute.url])){
              module.theme.locals[restRoute.url]( req, res )
              return bus.then(function(){
                bus.data( 'respond.page',page )
              })
            }else{
              bus.data( 'respond.page',page )
              bus.data('respond.data', module.theme.locals[restRoute.url] )
            }
          }else{
            bus.data( 'respond.page',page )
          }
        }else{
          ZERO.mlog("THEME"," cannot find any match",JSON.stringify(restRoute),cachePath)
        }
      }).then(function(){
        next()
      }).catch(function(err){
        console.log( err )
        ZERO.error(err)
      })


    }

    root.dep.request.add( matchRoute + "/*",reqHandler )
  },
  findPage : function( cache, restRoute, themePath ){
    var root = this
    //TODO find the right view file
    var i, templateName, templatePath, tmp = restRoute.url.slice(1).split("/"), extension

    if( tmp.length == 1){

      // 测试代码, 优先找到符合条件的页面，如果没有找到，则按照crud action pages的方式寻找？
      templateName = tmp[0]
      templatePath = path.join( appUrl, themePath, templateName )
      extension = findExtension( cache.page,root.config.engines, templatePath )

      if (!extension) {
        //deal with basic crud action pages
        templateName = tmp.concat(root.config.crudMap[restRoute.method]).join('-')
        templatePath = path.join( appUrl, themePath, templateName)
        extension = findExtension( cache.page,root.config.engines,templatePath )
      }

    }else{
      for( i = tmp.length;i>0; i--){
        templateName = tmp.slice(0,i).join('-')
        templatePath = path.join( appUrl, themePath, templateName)
        extension = findExtension( cache.page,root.config.engines,templatePath )
        if( extension ) break;
      }
    }

    return extension ? path.join( themePath, templateName) + "." +extension : false
  }

}

