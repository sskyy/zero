var UPYun = require('./upyun').UPYun;
// Test code

// 初始化空间
// var upyun = new UPYun("buckname", "username", "password");

//获取空间占用大小
// upyun.getBucketUsage(testCallback);

// upyun.getFolderUsage('/', testCallback);

// upyun.writeFile('/test.txt', '12323231', false, testCallback);

// upyun.writeFile('/test/test.txt', '12323231', true, testCallback);

// upyun.getFileInfo('/test.txt', testCallback);

// var fs =  require('fs');
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

// upyun.readFile('/test.txt', 'test.txt', testCallback);

// upyun.deleteFile('/test.txt', testCallback);

// upyun.mkDir('/test1', true, testCallback);

// upyun.rmDir('/test1', testCallback);

// upyun.readDir('/', testCallback);

function testCallback(err, data) {
    if (!err) {
        console.log('Data: ');
        console.log(data);
    }
    else {
        console.log('Error: ');
        console.log(err);
    }
}

function md5(string) {
    var crypto = require('crypto');
    var md5sum = crypto.createHash('md5');
    md5sum.update(string, 'utf8');
    return md5sum.digest('hex');
}
