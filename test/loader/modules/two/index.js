module.exports = {
  dependencies : ['one'],
  init : function( one ){
    console.log("two init called", one.info )
  }
}