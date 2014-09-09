# zero

<pre>

├── app.js                              主文件，用 node app 来执行。 
├── config.json                         全局配置文件，写在这里的配置会覆盖掉模块的默认配置。
├── modules                             用户的模块文件夹，该目录下每个文件夹或文件都是一个单独模块。
│   ├── file.js                        文件上传模块，上传的同时要在数据库中插入记录。未完成。
│   ├── index.js                       索引模块，文章的 category、tag 都是索引的一种。未完成。
│   ├── node.js                        节点模块，用来生成节点简介等功能。未完成。
│   ├── theme.js                       主题模块，为依赖此模块的上层模块提供各种引擎的页面渲染。
│   ├── twenty                         twenty示例。
│   │   ├── index.js
│   │   ├── package.json
│   │   └── themes
│   │       └── default
│   │           ├── node.jade
│   │           ├── statics
│   │           │   ├── haha.js
│   │           │   └── no.ejs
│   │           └── test.jade
│   └── user                           用户模块。
│       ├── config.js
│       ├── listen.js
│       ├── models.js
│       ├── package.json
│       └── user.js
├── package.json                        
├── system
│   ├── core
│   │   ├── bootstrap.js              zero启动文件。确保所有模块正确实例化，并调用它们的bootstrap方法。
│   │   ├── bus.js                    事件机制的核心！事件代理类定义文件。
│   │   └── loader.js                 模块加载文件。负责解析模块依赖，将模块实例化。
│   └── modules                        系统模块文件夹。
│       ├── bus.js                     事件代理模块，它为所有有 listen 字段模块提供服务。
│       ├── config.js                  配置模块，它为所有有 config 字段的模块提供服务，并会将更目录下的 config.json 覆盖模块的默认配置。
│       ├── model.js                   model 模块，为所有有 model 字段的模块提供数据库服务，并监听系统内的 CRUD 事件，处理 model 的增删改查。
│       ├── request.js                 请求模块，为所有有 route 字段的模块提供底层 express 的路由功能。
│       ├── respond.js                 响应模块，为所有模块提供最后的默认路由服务。它将取bus.data('respond')作为输出值。
│       ├── rest.js                    rest模块，为所有model里面有手动声明 rest : false 的模块提供标准接口服务。
│       └── statics.js                 静态资源模块， 为所有有 statics 字段的模块提供 express 底层的 static 服务。
└── zero.js      命令行文件，用来实现 `zero install twenty`，未完成。

</pre>

 


