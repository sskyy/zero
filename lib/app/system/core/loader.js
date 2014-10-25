var fs = require('fs'),
  path = require('path'),
  Promise = require('bluebird'),
  async = require('async'),
  _ = require('lodash'),
  config = {
    modulePath : path.join(process.cwd(),'modules')
  },
  modules

function requireModulesByPath( modulePath) {
  var files = fs.readdirSync(modulePath).filter(function( name){ return !/^\./.test(name)}),
    result = {}

  files.forEach(function (fileName) {
    var info = require(path.join(modulePath ,fileName,'package.json'))
    var moduleName = info.name.replace("zero-","")

    //1. check name
    if( Object.keys(_.pick(result[moduleName],['name','dependencies','info','status'])).length){
      throw new Error("you cannot use 'name','dependencies', 'info', or 'status' as property name in your module, they are specified by zero")
    }

    //2. check dependencies
    var modulesNotExists = _.without.apply(_,[Object.keys(info.zero.dependencies)].concat(files))
    if( modulesNotExists.length ){
      throw new Error( "module "+ moduleName + " dependencies : " + modulesNotExists.join(",") + " not exists.")
    }

    //3. check config files
    if( info.zero.configs ){
      !_.isArray( info.zero.configs ) && ( info.zero.configs = [info.zero.configs])
      info.zero.configs.forEach(function( configFile){
        if( !fs.existsSync( path.join( config.modulePath, moduleName, configFile)) ){
          throw new Error("module "+moduleName+" lack of config file: "+configFile)
        }
      })
    }

    result[moduleName] = require(path.join(modulePath ,fileName))
    result[moduleName].info = info
    result[moduleName].name = moduleName
    result[moduleName].dependencies =  info.zero.dependencies || {}

  })

  return result
}


function callInit( moduleName, from, modules, nextModule ){
  var module = modules[moduleName]

  if(!module){
    return nextModule(new Error(moduleName+" not installed"))
  }

  if( module.status ) return nextModule()

  ZERO.mlog("loader", "begin init", moduleName)
  from = from || []
  module.status = 'initializing'

  if(_.intersection( Object.keys(module.dependencies), from).length !== 0){
    throw new Error("circular dependencies detected for ", from.join(','))
  }



  //1. init all dependencies first
  async.eachSeries(Object.keys(module.dependencies), function( dependencyName, nextDep){

    if( modules[dependencyName].status ) return nextDep()

    //console.log("init dependency", dependencyName)
    callInit( dependencyName, from.concat[moduleName], modules, nextDep)

  }, function initDependenciesDone( err ){
    if( err )  return nextModule(err)

    //console.log("dependencies of", moduleName,"done")

    //2.1 attach all dependencies to module.dep
    module.dep = {}
    Object.keys(module.dependencies).forEach( function(dependencyName){
      module.dep[dependencyName] = _.extend(_.clone(modules[dependencyName]),{relier:moduleName})
    })

    //2.2 call init function of current module
    var initResult = _.isFunction(module.init )?module.init.apply( module, Object.keys(module.dependencies).map(function(name){ return modules[name]})):true

    Promise.resolve(initResult).then(function(){
      //3. call dependency's expand function to expand current module
//      console.log("begin expand of", moduleName,"done")

      async.eachSeries( Object.keys(module.dependencies), function( dependencyName, nextExpand){
        var dependency = modules[dependencyName],
          expandResult = dependency.expand ? dependency.expand.call( dependency, module) : true

        Promise.resolve(expandResult).then(function(){
          nextExpand()
        })

      },function expandCurrentModuleDone(){
        module.status = 'initialized'
        nextModule()
      })
    })

  })
}

exports.loadAll = function (opt, loadModulesDone) {
  var app = this,modules
  opt = _.defaults(opt || {}, config)


  try{
    modules = requireModulesByPath(opt.modulePath)
  }catch(e){
    return loadModulesDone(e)
  }

  ZERO.info( "modules:",Object.keys(modules).length, Object.keys(modules).join(" | "))

  async.eachSeries( Object.keys(modules), function( name, nextModule ){
    if( modules[name].status ) return nextModule()

    callInit( name, [], modules, nextModule)
  }, function(err){
    if( err ){
      ZERO.error("call module init failed, due to", err)
      return loadModulesDone(err)
    }

    app.modules = modules
    loadModulesDone()
  })
}
