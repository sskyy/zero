var UPYun = require('./lib/upyun').UPYun;
var fs =  require('fs');
var path = require('path')
var q = require('q')


// var fileContent = fs.readFileSync('test.jpg');
// var md5Str = md5(fileContent);
// upyun.setContentMD5(md5Str);
// upyun.setFileSecret('bac');
// upyun.writeFile('/test.jpg', fileContent, false, function(err, data){
//     if (!err) {
//         console.log(data);
//         console.log(upyun.getWritedFileInfo('x-upyun-width'));
//         console.log(upyun.getWritedFileInfo('x-upyun-height'));
//         console.log(upyun.getWritedFileInfo('x-upyun-frames'));
//         console.log(upyun.getWritedFileInfo('x-upyun-file-type'));
//     }
// });



module.exports = function( module, storageInfo ){
  var upyun = new UPYun(storageInfo.bucket, storageInfo.username, storageInfo.password);
  var key = [storageInfo.model.identity,'create','before'].join('.')

  module.listen[key] = function storeFileToUpyun( file ){
    return q.Promise(function( resolve, reject){
      fs.readFile( path.join( process.cwd(), file.path), function( err, data ){
        if( err ){
          ZERO.error( err )
          return reject(err)
        }

        upyun.writeFile( path.join(storageInfo.directory||"/",file.name), data, false, function(err, data){
          if( err ){
            ZERO.error(err)
            return reject(err)
          }

          ZERO.info("uppload success!", data )
          resolve()
        })
      })
    })
  }

}