var fs = require('fs'),
  path = require('path'),
  Promise = require('bluebird'),
  async = require('async'),
  _ = require('lodash'),
  config = {
    modulePath : path.join(__dirname,'../../modules')
  },
  modules

function requireModulesByPath( modulePath) {
  var files = fs.readdirSync(modulePath),
    result = {}

  files.forEach(function (fileName) {
    if(/^\./.test(fileName) ) return false
    var info = require(path.join(modulePath ,fileName,'package.json'))
    var moduleName = info.zero.name || info.name
    result[moduleName] = require(path.join(modulePath ,fileName))
    result[moduleName].name = moduleName
    result[moduleName].dependencies =  info.zero.dependencies
  })

  return result
}


function callInit( moduleName, from, modules, nextModule ){
  var module = modules[moduleName]

  if(!module){
    throw new Error(moduleName+" not installed")
  }

  if( module.status ) return nextModule()

  ZERO.mlog("loader", "begin init", moduleName)
  from = from || []
  module.status = 'initializing'

  if(_.intersection( Object.keys(module.dependencies), from).length !== 0){
    throw new Error("circular dependencies detected for ", from.join(','))
  }

  console.log("begin to handler dependencies of", moduleName, module.dependencies)
  async.eachSeries(Object.keys(module.dependencies), function( dependencyName, nextDep){
    if( modules[dependencyName].status ) return nextDep()

    //1. init all dependencies first
    console.log("init dependency", dependencyName)
    callInit( dependencyName, from.concat[moduleName], modules, nextDep)

  }, function initDependenciesDone(){
    console.log("dependencies of", moduleName,"done")

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
        console.log("call expand of", dependencyName)
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
  var app = this

  opt = _.defaults(opt || {}, config)

  var modules = requireModulesByPath(opt.modulePath)

  ZERO.info( "modules:",Object.keys(modules).length, Object.keys(modules).join(" | "))

  async.eachSeries( Object.keys(modules), function( name, nextModule ){
    if( modules[name].status ) return nextModule()

    callInit( name, [], modules, nextModule)
  }, function(){
    app.modules = modules
    loadModulesDone()
  }, function(err){
    if( err ){
      console.trace( err)
    }else{
      loadModulesDone()
    }
  })
}
