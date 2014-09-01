module.exports = {
  models : [{
    identity: 'user',
    connection: 'myLocalDisk',

    attributes: {
      first_name: 'string',
      last_name: 'string'
    },
    rest : true
  }]
}