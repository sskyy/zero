var fs = require('fs'),
  path = require('path'),
  Promise = require('bluebird'),
  async = require('async'),
  _ = require('lodash'),
  config = {
    modulePath : path.join(process.cwd(),'modules')
  },
  winston = require('winston'),
  logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ level: 'info' }),
    ]}),
  modules

function requireModulesByPath( modulePath) {
  var files = fs.readdirSync(modulePath).filter(function( name){ return !/^\./.test(name)}),
    result = {}

  files.forEach(function (fileName) {
    var packageInfo = require(path.join(modulePath ,fileName,'package.json'))
    var moduleName = (packageInfo.zero && packageInfo.zero.alias) || packageInfo.name.replace("zero-","")

    packageInfo.zero = packageInfo.zero || {}
    packageInfo.zero.dependencies = packageInfo.zero.dependencies || {}


    //1. check dependencies
    var modulesNotExists = _.without.apply(_,[Object.keys(packageInfo.zero.dependencies)].concat(files))
    if( modulesNotExists.length ){
      throw new Error( "module "+ moduleName + " dependencies : " + modulesNotExists.join(",") + " not exists.")
    }

    //2. check config files
    if( packageInfo.zero.configs ){
      !_.isArray( packageInfo.zero.configs ) && ( packageInfo.zero.configs = [packageInfo.zero.configs])
      packageInfo.zero.configs.forEach(function( configFile){
        if( !fs.existsSync( path.join( config.modulePath, moduleName, configFile)) ){
          throw new Error("module "+moduleName+" lack of config file: "+configFile)
        }
      })
    }

    result[moduleName] = require(path.join(modulePath ,fileName))

    //3. check module property
    if( Object.keys(_.pick(result[moduleName],['name','dependencies','packageInfo','status'])).length){
      throw new Error("you cannot use 'name','dependencies', 'packageInfo', or 'status' as property name in your module, they are specified by zero")
    }


    result[moduleName].packageInfo = packageInfo
    result[moduleName].name = moduleName
    result[moduleName].dependencies =  packageInfo.zero.dependencies || {}

  })

  return result
}


function callInit( moduleName, from, modules, nextModule ){
  var module = modules[moduleName]

  if(!module){
    return nextModule(new Error(moduleName+" not installed"))
  }

  if( module.status ) return nextModule()

  from = from || []
  module.status = 'initializing'


  if(_.intersection( Object.keys(module.dependencies), from).length !== 0){
    throw new Error("circular dependencies detected for "+ from.concat(moduleName).join(','))
  }

  //1. init all dependencies first
  async.eachSeries(Object.keys(module.dependencies), function( dependencyName, nextDep){

    if( modules[dependencyName].status ) return nextDep()

    callInit( dependencyName, from.concat(moduleName), modules, nextDep)

  }, function initDependenciesDone( err ){
    if( err )  return nextModule(err)


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
  var modules
  opt = _.defaults(opt || {}, config)

  try{
    modules = requireModulesByPath(opt.modulePath)
  }catch(e){
    return loadModulesDone(e)
  }

  logger.info( "modules:",Object.keys(modules).length, Object.keys(modules).join(" | "))

  async.eachSeries( Object.keys(modules), function( name, nextModule ){
    if( modules[name].status ) return nextModule()

    callInit( name, [], modules, nextModule)
  }, function(err){
    loadModulesDone( err , modules)
  })
}
