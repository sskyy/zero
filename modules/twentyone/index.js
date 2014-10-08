module.exports = {
  deps : ['model','rest','file','storage','config','theme'],
  models : require('./models'),
  config : {
    storage : {
      upyun : {
        username : 'zerojs',
        password : 'zerojs.io',
        bucket : 'twentyone',
        directory : '/'
      }
    }
  },
  theme : {
    directory : 'public'
  }
}