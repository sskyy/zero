var path = require('path'),
  fs = require('fs'),
  flo = require('express-fb-flo'),
  root = path.join(__dirname,'../../'),
  modulePath = "./modules",
  systemModulePath = "./system/modules",
  _ = require('lodash'),
  colors = require("colors"),
  systemModules = _.without(fs.readdirSync(path.join(root,systemModulePath)),'.','..')

module.exports = function( server, app ){

  var statics = {}
  _.forEach( app.modules, function( module){
    var isSystemModule = _.find( systemModules, module.name )

    if( module.statics ){
      _.forEach( module.statics, function( directoryPath, matchUrl){
        statics[path.relative(root,directoryPath)] ={
          url : matchUrl,
          origin : directoryPath
        }
      })
    }

    if( module.theme && module.theme.directory ){
      statics[path.join((isSystemModule?systemModulePath:modulePath),module.name, module.theme.directory)] = {
        url : '/' + module.name,
        origin : path.join( root, (isSystemModule?systemModulePath:modulePath), module.name, module.theme.directory ),
        isSystemModule : isSystemModule
      }
    }
  })

  var frontEndScriptGlob = Object.keys(statics).map( function( directoryPath){
    return path.join( directoryPath,'**/*.js')
  })

  console.log( statics)
//  console.log( frontEndScriptGlob)

  //TODO deal with theme jade->html and script reload
  flo(root,{
    server:server,
    verbose:false,
    glob:[
      'modules/**/*.css',
      'modules/**/*.html',
      'module/**/*.jade',
      'system/modules/**/*.css',
      'system/modules/**/*.html'
    ].concat(frontEndScriptGlob)},function( filepath, callback){

    var matchedStatic = _.pick( statics, function( obj, directoryPath ){
      return directoryPath == filepath.slice(0, directoryPath.length )
    })

    var matchedToArray = _.pairs( matchedStatic)
    if( matchedToArray.length !== 0 ){
      //machedToArray[0][1].url is url,
      var resourceURL = path.join( matchedToArray[0][1].url, path.relative( matchedToArray[0][1].origin,path.join(root,filepath)))

      console.log( "resourceURL---------->",resourceURL)
      callback({
        resourceURL : resourceURL,
        contents : fs.readFileSync(path.join(root,filepath)),
        update : function( _window,_resourceURL){
          if( /\.js$/.test( _resourceURL)){
            location.reload()
          }
        }
      })
    }

  })
}
