/////////////////////////////////////////////////////////////////
// This is a entry file for local debugging.
// We strongly suggest you use `zero start`  to start you application.
/////////////////////////////////////////////////////////////////

var program = require('commander')
var start = require('zero/lib/start')

program
  .usage('Start a zero program.')
  .option('-p, --port', 'Port to listen.', 3000)
  .option('-q, --quiet', 'Display no info.')
  .parse(process.argv)

var options = {}

program.options.forEach(function(option){
  var name = option.long.replace('--','')
  options[name] = program[name]
})

start(options)
