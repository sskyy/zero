var packages = require('./packages')
var _ = require('lodash')
var  Repo = require('git').Repo,
  Git = require('git').Git,
  fs = require('fs'),
  path = require('path')

var subProgram = require('commander');


function absolutePath( inputPath ){
  return /^\//.test(inputPath) ? inputPath : path.join(process.cwd(), inputPath)
}

function gitClone( repoPath, localPath, cb){
  var git = new Git

  console.log(("cloning " + repoPath +" to " +localPath).cyan)
  git.git("clone",{},repoPath,localPath, function(err, res){
    console.log( ("clone done " + repoPath).green,err||"")
    cb && cb( err, res)
  })
}

module.exports = function (program) {
  program.command("package <pkg>")
    .option('-t --target <targetPath>','target path of package',absolutePath,path.join(process.cwd(),"./modules" ))
    .action(function(pkg,options){

      var modules = packages[pkg]
      console.log("installing",pkg,modules)

      _.forEach( modules,function( gitRepo, moduleName){
        try{
          gitClone(gitRepo,path.join(options.target, moduleName))
        }catch(e){
          console.log(e)
        }
      })
    })

}