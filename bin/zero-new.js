var fs = require("fs"),
  fse = require("fs-extra"),
  path = require('path'),
  _ = require('lodash')

module.exports = function( program ){
  var currentPath = process.cwd(),
    zeroPath = path.join(__dirname, "..")

  program.command("new [appName]")
    .description("generate new zero app")
    .action(function( appName ){
      try{
        var appPath
        if( !appName ){
          if( fs.readdirSync( currentPath).filter(function(p){return !/\.+/.test(p)}).length ){
            return console.log("This directory is not empty, generate abort.")
          }

          appName = currentPath.split(path.sep).pop()
          appPath = currentPath
        }else{
          appPath = path.join( currentPath, appName )
        }

        //mk app structure
        fse.ensureDirSync( appPath )
        fse.copySync(path.join(zeroPath,"lib/app"),appPath)
        fs.mkdirSync( path.join(appPath ,"node_modules"))
        fse.ensureDirSync( path.join(appPath ,"modules"))

        //extract node_modules
        var packageInfo = _.extend(require(path.join(zeroPath,'lib/package.sample.json')),{name:appName})
        var neededModules = Object.keys( packageInfo.dependencies )
        neededModules.forEach(function( moduleName){
          fs.symlinkSync(path.join(zeroPath,"node_modules",moduleName),path.join(appPath,"node_modules",moduleName))
        })

        //output JSON
        fse.outputJsonSync(path.join(appPath,"package.json"),packageInfo)

      }catch(e){
        console.log("generate app failed, due to")
        console.trace(e)
      }
    })
}