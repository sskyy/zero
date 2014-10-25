var path = require('path'),
  fs = require('fs'),
  flo = require('fb-flo-extra'),
  root = path.join(__dirname,'../../'),
  modulePath = "./modules",
  _ = require('lodash'),
  colors = require("colors"),
  argv = require('optimist').argv


module.exports = function( server, app ){

  var statics = {}
  _.forEach( app.modules, function( module){

    if( module.statics ){
      _.forEach( module.statics, function( directoryPath, matchUrl){
        statics[path.relative(root,directoryPath)] ={
          url : matchUrl,
          origin : directoryPath
        }
      })
    }

    if( module.theme && module.theme.directory ){
      statics[path.join(modulePath,module.name, module.theme.directory)] = {
        url : '/' + module.name,
        origin : path.join( root, modulePath, module.name, module.theme.directory )
      }
    }
  })

  var frontEndScriptGlob = Object.keys(statics).map( function( directoryPath){
    return path.join( directoryPath,'**/*.js')
  })

  console.log( "dev module watching:", _.pluck(_.values(statics),"origin"))

  //TODO deal with theme jade->html and script reload
  if( !argv.prod ){
    flo(root,{
      server:server,
      verbose:false,
      glob:[
        'modules/**/*.css',
        'modules/**/*.html',
        'modules/**/*.jade'
      ].concat(frontEndScriptGlob)},function( filepath, callback){

      var matchedStatic = _.pick( statics, function( obj, directoryPath ){
        return directoryPath == filepath.slice(0, directoryPath.length )
      })

      var matchedToArray = _.pairs( matchedStatic)
      if( matchedToArray.length !== 0 ){
        var resourceURL = path.join( matchedToArray[0][1].url, path.relative( matchedToArray[0][1].origin,path.join(root,filepath)))

        callback({
          resourceURL : resourceURL,
          contents : fs.readFileSync(path.join(root,filepath)),
          reload : /\.(js|jade|html)$/.test( resourceURL)
        })
      }

    })
  }
}
