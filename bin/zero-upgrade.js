var fs = require('fs'),
  fse = require('fs-extra')

module.exports = function(program) {
  program
    .command('upgrade')
    .description('upgrade zero core')
    .action(function () {

    })
}