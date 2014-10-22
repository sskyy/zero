var npm = require('npm'),
  path = require('path'),
  fs = require('fs'),
  fse = require('fs-extra'),
  _ = require('lodash'),
  async = require('async')
  colors = require("colors")

var modulePath = path.join( process.cwd(), 'modules')
var nodeModulePath = path.join( process.cwd(), 'node_modules')

module.exports = function(program){

  program.command("install <moduleName>")
    .description("install a module and its dependencies")
    .action(function( moduleName){
      if( !moduleName ){
        return console.log("module not specified")
      }

      //TODO parse version
      npm.load({}, function (err) {
        if( err ) return console.log(err)

        install([moduleName], function(err){
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


