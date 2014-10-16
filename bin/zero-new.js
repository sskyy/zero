var fs = require("fs"),
  fse = require("fs-extra"),
  path = require('path')

module.exports = function( program ){
  var currentPath = process.cwd(),
    zeroPath = path.join(__dirname, "..")

  program.command("new [appName]")
    .description("generate new zero app")
    .action(function( appName ){
      if( !appName ){
        if( fs.readdirSync( currentPath).filter(function(p){return !/\.+/.test(p)}).length ){
          return console.log("This directory is not empty, generate abort.")
        }
      }

      var appPath = path.join( currentPath, appName )
      if( fs.existsSync(appPath) ){
        return console.log(appPath,"already exist, generate abort.")
      }

      if( !fs.mkdirSync( appPath ) ){
        return console.log("make dir",appPath,"failed, generate abort.")
      }


      //mk app structure
//      fse.copySync(path.join(zeroPath,"app"),path.join(appPath,""))

      //extract node_modules
//      fse.copySync(path.join(zeroPath,"node_modules"),path.join(appPath,"node_modules"))





    })
}