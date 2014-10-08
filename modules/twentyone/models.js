module.exports = [{
  identity : 'artwork',
  connection: 'myLocalDisk',
  attributes : {
    title : 'string'
  },
  rest : true,
  isNode : true
},{
  identity : 'attachment',
  connection: 'myLocalDisk',
  attributes : {
  },
  rest : true,
  isFile : true,
  storage : 'upyun'
}]