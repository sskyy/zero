var gaze = require('gaze')
var path = require('path')

gaze( path.join(__dirname, './system/modules/dev/**/*.css'), {mode:"poll"},function(err){
  if( err ){
    return console.log( "gaze init error", err )
  }

  this.watched(function(err, watched) {
    console.log(watched);
  });

//  root.emit.call(root, 'ready')

  this.on('changed', function(filepath) {
    console.log(filepath + ' was changed');
//    root.onFileChange.call(root,path.relative( dir,filepath));
  });
})