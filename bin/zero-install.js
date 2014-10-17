var npm = require('npm')

module.exports = function(program){

  program.command("install <moduleName>")
    .description("install a module and its dependencies")
    .action(function( moduleName){

    })
}
