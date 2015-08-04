var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  _ = require('lodash'),
  co = require('co'),
  modules

function hasReservedKey(module) {
  return Object.keys(_.pick(module, ['name', 'dependencies', 'info', 'status'])).length !== 0
}

function requireModulesByPath(modulePath) {
  var files = fs.readdirSync(modulePath).filter(function (name) {
      return !/^\./.test(name)
    }),
    result = {}

  files.forEach(function (fileName) {
    var packageInfo = require(path.join(modulePath, fileName, 'package.json'))
    var moduleName = (packageInfo.zero && packageInfo.zero.name) || packageInfo.name.replace("zero-", "")

    packageInfo.zero = packageInfo.zero || {}
    packageInfo.zero.dependencies = packageInfo.zero.dependencies || {}


    //1. check dependencies
    var modulesNotExists = _.without.apply(_, [Object.keys(packageInfo.zero.dependencies)].concat(files))
    if (modulesNotExists.length) {
      throw new Error("module " + moduleName + " dependencies : " + modulesNotExists.join(",") + " not exists.")
    }

    //2. check config files
    if (packageInfo.zero.configs) {
      !_.isArray(packageInfo.zero.configs) && ( packageInfo.zero.configs = [packageInfo.zero.configs])
      packageInfo.zero.configs.forEach(function (configFile) {
        if (!fs.existsSync(path.join(config.modulePath, moduleName, configFile))) {
          throw new Error("module " + moduleName + " lack of config file: " + configFile)
        }
      })
    }

    result[moduleName] = require(path.join(modulePath, fileName))

    //3. check module property
    if (hasReservedKey(result[moduleName])) {
      throw new Error("you cannot use 'name','dependencies', 'info', or 'status' as property name in your module, they are specified by zero")
    }

    result[moduleName].info = packageInfo
    result[moduleName].name = moduleName
    result[moduleName].dependencies = packageInfo.zero.dependencies || {}

  })

  return result
}


function hasCircularDependencies(dependencies, from) {
  return _.intersection(Object.keys(dependencies), from).length !== 0
}

function isGenerator(fn) {
  return fn && fn.constructor.name === 'GeneratorFunction';
}

function* callInit(moduleName, from, modules) {
  var logger = this.logger
  var module = modules[moduleName]
  from = from || []


  if (!module) throw new Error(moduleName + " not installed")
  if (hasCircularDependencies(module.dependencies, from)) throw new Error(`circular dependencies detected for  ${from.concat(moduleName).join(',')}`)
  if (module.status) return

  module.status = 'initializing'
  module.deps = {}
  module.reliers = {}

  //1. init all dependencies first
  for (var dependencyName in module.dependencies) {
    yield callInit.call(this, dependencyName, from.concat(moduleName), modules)
  }

  //2.1 attach all dependencies to module.dep
  Object.keys(module.dependencies).forEach(function (dependencyName) {
    module.deps[dependencyName] = _.extend(_.mapValues(modules[dependencyName], function(value){
      if( typeof value === 'function' || isGenerator(value)){
        return value.bind( modules[dependencyName] )
      }
    }), {relier: moduleName})
  })

  logger.mlog(module.name, "init")
  //2.2 call init function of current module
  if( module.init ){
    if (isGenerator(module.init)) {
      yield module.init(this)
    } else {
      module.init(this)
    }
  }

  //这里有问题，应该是自己init完之后
  for (var dependencyName in module.dependencies) {
    modules[dependencyName].reliers[module.name] = module

    if( modules[dependencyName].extend === undefined ) continue

    if (isGenerator(modules[dependencyName].extend)) {
      yield modules[dependencyName].extend(module)
    } else {
      modules[dependencyName].extend(module)
    }

  }
}

module.exports = function* (modulePath) {
  var modules

  modules = requireModulesByPath(modulePath)

  for (var name in modules) {
    if (modules[name].status) continue
    yield callInit.call(this, name, [], modules)
  }

  return modules

}