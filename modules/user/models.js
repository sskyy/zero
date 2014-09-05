module.exports = function( module){
  return [{
    identity: 'user',
    connection: 'myLocalDisk',

    attributes: {
      name: 'string'
    },
    rest : true
  }]
}
