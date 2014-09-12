var fs = require('fs'),
  path = require('path'),
  q = require('q'),
  async = require('async'),
  _ = require('lodash'),
  config = {
    systemModulePath : path.join(__dirname, '../modules/'),
    modulePath : path.join(__dirname,'../../modules')
  },
  modules

function requireModules( modulePath, modules) {
  var files = fs.readdirSync(modulePath),
    result = {}

  files.forEach(function (fileName) {
    if (/^\./.test(fileName)
      || ( modules && modules.indexOf(fileName) == -1)) return

    result[fileName.replace(/\.js$/,'')] = require(path.join(modulePath ,fileName))
  })

  return result
}

function callInit( moduleName, from, cb ){
  var module = modules[moduleName]

  if( module.status ) return cb()

  console.log( "begin init", moduleName)
  from = from || []
  module.status = 'initializing'
  module.deps = module.deps  || []

  if(_.intersection( module.deps, from).length !== 0){
    throw new Error("circular dependencies detected for ", from.join(','))
  }

  async.eachSeries(module.deps, function( dependencyName, depCb){
    if( modules[dependencyName].status ) return depCb()

    //1. init all dependencies first
    callInit( dependencyName, from.concat[moduleName], depCb)
  }, function(){

    //2.1 attach all dependencies to module
    module.dep = {}
    module.deps.forEach( function( name){
      module.dep[name] = _.extend(_.clone(modules[name]),{relier:moduleName})
    })

    //2.2 call init function of current module
    var initResult = _.isFunction(module.init )?module.init.apply( module, module.deps.map(function(name){ return modules[name]})):true

    q(initResult).then(function(){
      //3. call dependency's expand function to expand current module
      async.map( module.deps, function( dependencyName, expandCb){
        var dependency = modules[dependencyName],
          expandResult = dependency.expand ? dependency.expand.call( dependency, module) : true

        q(expandResult).then(function(){
          expandCb()
        })

      },function(){
        module.status = 'initialized'
        cb()
      })
    }).fail( function(err){
      console.log(err)
    })
  })
}

exports.loadAll = function (opt, cb) {
  var app = this

  opt = _.defaults(opt || {}, config)

  var systemModules = requireModules(opt.systemModulePath, opt.modules),
  userModules = _.mapValues(requireModules(opt.modulePath, opt.modules ),function(module){
    module.deps = module.deps || Object.keys( systemModules )
    //TODO notice! we attached app to every module
    return module
  })

  modules = _.mapValues( _.merge( systemModules, userModules), function(module, name){
    module.app = app
    module.name = name
    return module
  })

  console.log( "modules:", Object.keys(modules))
  async.eachSeries( Object.keys(modules), function( name, moduleCb ){
    if( modules[name].status ) return moduleCb()
    callInit( name, [], moduleCb)
  }, function(){
    app.modules = modules
    cb()
  })
}
