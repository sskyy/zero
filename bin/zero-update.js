var  path = require('path'),
  fs =require('fs'),
  fse =require('fs-extra'),
  colors = require('colors'),
  npm = require('npm'),
  async = require('async'),
  _ = require("lodash")

function list(val) {
  return val.split(',');
}

function absolutePath( inputPath ){
  return /^\//.test(inputPath) ? inputPath : path.join(process.cwd(), inputPath)
}


function compareVersion( verA, verB ){
  var verAtmp = verA.split("."), verBtmp = verB.split("."),
    i= 0, length = Math.max(verAtmp.length , verBtmp.length )

  for( ;i<length;i++){
    if( parseInt(verAtmp[i] || 0) > parseInt(verBtmp[i]||0) ){
      return true
    }else if( parseInt(verAtmp[i] || 0) < parseInt(verBtmp[i]||0)){
      return false
    }
  }
}

module.exports = function(program){

  program
    .command('update [modules]')
    .description('update modules')
    .option("-e, --exclude [modules]", "exclude modules of git pull", list, [])
    .option("-s --src <modulePath>", "module path", absolutePath, path.join(process.cwd(),"./modules" ))
    .action(function(modules, options){
      modules = modules ? list(modules) :[]

      if( modules.length == 0 ){
        modules = fs.readdirSync(options.src).filter(function( p){return !/^\./.test(p)})
        _.without.apply(_, modules.concat(options.exclude))
      }

      npm.load({}, function (err) {
        if( err ) return console.log( err )
        async.forEachSeries( modules, function( moduleName, nextModule){

          //1 compare version
          var moduleInfo = fse.readJsonSync( path.join( options.src, moduleName,"package.json")),
            modulePath = path.join( options.src,moduleName),
            npmModuleName = "zero-"+moduleName
          npm.commands.view([ npmModuleName ], function( err, res){
            if( err){
              console.log("err", err)
              return nextModule()
            }

            var latestModuleInfo = _.values( res).shift()
            console.log("begin to compare version",latestModuleInfo.version, moduleInfo.version , compareVersion( latestModuleInfo.version, moduleInfo.version))
            if( compareVersion( latestModuleInfo.version, moduleInfo.version)){
              //2 stash config files

              if( latestModuleInfo.zero.configs ){
                console.log("moving config files")
                if( !_.isArray( latestModuleInfo.zero.configs)){
                  latestModuleInfo.zero.configs = [latestModuleInfo.zero.configs]
                }
                fse.ensureDir(path.join( options.src,".tmp"))
                latestModuleInfo.zero.configs.forEach(function( configPath){
                  fse.ensureDir( path.dirname( path.join( options.src,".tmp",configPath)))
                  fs.renameSync( path.join( modulePath,configPath), path.join( options.src,".tmp",configPath))
                })
              }

              //3 install latest version
              npm.commands.install([npmModuleName], function( err){
                if( err){
                  console.log( err)
                  return nextModule()
                }

                fse.removeSync( modulePath )
                fs.renameSync( path.join( process.cwd(),"node_modules",npmModuleName), modulePath)

                //4 move config files back
                if( latestModuleInfo.zero.configs ){
                  latestModuleInfo.zero.configs.forEach(function( configPath){
                    fse.removeSync( path.join( modulePath,configPath) )
                    fs.renameSync( path.join( options.src,".tmp",configPath),path.join( modulePath,configPath))
                  })
                }
                //TODO install new added zero dependencies

              })
            }else{
              nextModule()
            }
          })
        })

      })
    });

}


