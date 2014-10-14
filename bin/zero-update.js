var  Repo = require('git').Repo,
  Git = require('git').Git,
  path = require('path'),
  fs =require('fs'),
  colors = require('colors')


function list(val) {
  return val.split(',');
}

function absolutePath( inputPath ){
  return /^\//.test(inputPath) ? inputPath : path.join(process.cwd(), inputPath)
}

function gitPull( modulePath, cb ){
  new Repo(modulePath,function(err, r){
    if( err ){
      console.log(modulePath, "is not a git repo")
      cb && cb( err, modulePath )
    }else{
      console.log(("pulling "+ modulePath).cyan )
      r.git.git("pull",{},'origin','master', function( err, res){
        console.log( modulePath.green, 'answering', res , err || '' )
        cb && cb( err, res)
      })
    }
  })
}

module.exports = function(program){

  program
    .command('update [modules]')
    .description('run git pull for all modules')
    .option("-e, --exclude [modules]", "exclude modules of git pull", list, [])
    .option("-s --src <modulePath>", "module path", absolutePath, path.join(process.cwd(),"./modules" ))
    .action(function(modules, options){
      modules = modules ? list(modules) :[]
      if( modules.length == 0 ){
        modules = fs.readdirSync(options.src).filter(function( p){return !/^\./.test(p)})
      }

      modules.forEach( function( moduleName){
        gitPull( path.join( options.src, moduleName ))
      })
    });

}


