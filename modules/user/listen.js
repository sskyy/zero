module.exports = {
  'user.login' : function login( params ){
    console.log( "[USER]: on user.login",params )
    this.data("user",{"id":1,"name":"zhenyu"})
  },
  'user.register' : function (){

  },
  'user.logout' : function(){

  }
}