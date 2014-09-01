module.exports = {
  models : [{
    identity: 'user',
    connection: 'myLocalDisk',

    attributes: {
      name: 'string'
    },
    rest : true
  }]
}