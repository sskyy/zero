module.exports = [{
  identity: 'post',
  connection: 'myLocalDisk',
  attributes: {
    title : 'string',
    content : 'string',
    category : 'array'
  },
  isNode : true,
  rest : true
},{
  identity : 'category',
  connection : 'myLocalDisk',
  attributes : {
    name : 'string',
    nodes : 'json'
  },
  isIndex : true,
  rest : true
}]