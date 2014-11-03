var  path = require('path'),
  fs =require('fs'),
  fse =require('fs-extra'),
  path = require('path'),
  _ = require("lodash"),
  appLibPath =  path.join(__dirname,"../lib/app")

module.exports = function(program){

  program
    .command('upgrade')
    .description('update core of zero')
    .action(function(){
      console.log("upgrading zero core")
      //backup config.json
      fs.renameSync( path.join(process.cwd(),"config.json"),path.join(process.cwd(),"config.json.bak"))

      //naive update, this will keep useless file
      fse.copySync( appLibPath, process.cwd() )

      //keep new config file
      fs.renameSync( path.join(process.cwd(),"config.json"),path.join(process.cwd(),"config.json.new"))
      fs.renameSync( path.join(process.cwd(),"config.json.bak"),path.join(process.cwd(),"config.json"))
      console.log("upgrading zero core done")
    });
}


