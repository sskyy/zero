var npm = require('npm'),
  path = require('path'),
  fs = require('fs'),
  fse = require('fs-extra'),
  _ = require('lodash'),
  async = require('async')
  colors = require("colors")

function pick( obj, toPick ){
  var result = {}
  toPick.forEach(function( attr ){
    if( obj[attr] !== undefined){
      result[attr] = obj[attr]
    }
  })
  return result
}


var modulePath = path.join( process.cwd(), 'modules')
var nodeModulePath = path.join( process.cwd(), 'node_modules')

module.exports = function(program){

  program.command("install [moduleName]")
    .description("install a module and its dependencies")
    .option('-r, --registry registry', 'Registry of module')
    .action(function( moduleName){

      var npmConfig = pick( program, ['registry'])

      npm.load(npmConfig, function (err) {
        if( err ) return console.log(err)
        var moduleNames = []

        if( !moduleName ){
          fs.readdirSync(modulePath).forEach(function( installedModule ){
            if( /^\./.test(installedModule)) return

            var dependencies = Object.keys(fse.readJsonSync( path.join( modulePath, installedModule,'package.json')).zero.dependencies)
            moduleNames = _.union( moduleNames, dependencies)
          })
        }else{
          moduleNames = [moduleName]
        }

        install(moduleNames, function(err){
          console.log("installing", moduleName,"done",err||"")
        })
      })
  })
}

function install( modules, currentModuleInstalled ){
  console.log("installing modules", modules)

  async.forEachSeries( modules, function( moduleName, nextModule){

    if( fs.existsSync( path.join(modulePath, moduleName))){
      console.log(moduleName,"exists")
      return nextModule()

    }else{
      var npmModuleName = "zero-"+moduleName
      console.log("tring to npm install", moduleName)

      npm.commands.install([npmModuleName],function(err, data){
        if( err ){
          console.log( ("install "+npmModuleName).red ,"error")
          return nextModule(err)
        }

        //1. move module folder
        fs.renameSync( path.join(nodeModulePath,npmModuleName), path.join( modulePath, moduleName))

        //2. read zero dependencies
        var dependencies = Object.keys(fse.readJsonSync( path.join( modulePath, moduleName,'package.json')).zero.dependencies)

        //TODO parse version
        if( dependencies.length ){
          install(dependencies, nextModule)
        }else{
          nextModule()
        }
      })
    }
  }, currentModuleInstalled)
}


