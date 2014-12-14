# How to use zero to develop a blog

## Overview

This guide will take [twenty](http://github.com/sskyy/zero-twenty)(a blog system) for example to show you how to use model, theme, rbac, and other popular modules that you probably would use in your own application.  

## Step by step

### 1 Creat zero application

```
> npm install zero -g  // install zero globally
> zero new myBlog      // create application folders
> cd myBlog            //enter the application root
```

### 2 Create your main module and add dependencies

Simply create a new folder named `blog` in folder `/modules`. Add a new package.json file to folder blog with content: 


```
{
  "name": "zero-blog",
  "version": "0.0.11",
  "description": "zero module",
  "dependencies": {
  },
  "zero": {
    "dependencies": {
      "configure": "^0.0.1",
      "file": "^0.0.1",
      "bus": "^0.0.1",
      "request": "^0.0.1",
      "node": "^0.0.1",
      "model": "^0.0.1",
      "rest": "^0.0.1",
      "theme": "^0.0.1",
      "rbac": "^0.0.1",
      "user": "^0.0.1",
      "statistic": "^0.0.1",
      "security": "^0.0.1",
      "relation": "^0.0.1",
      "index": "^0.0.1",
      "i18n": "^0.0.1"
    },
    "configs": [
      "./config.js"
    ]
  },
  "main" : "index.js"
}
```

To be clear that zero's dependencies is not the same as node module dependencies, you need to declare it in `zero` just like the code above. We will give details about what each module do. After the package.json was created, run 

```
> zero install
``` 
at the root of the application, this command will help you install every denpendent module automatically.

### 3 Create module entrance

Beside declaration of dependencies, zero module has nothing more diffrent than a node module. If you are not familiar with nodejs that would be ok, just follow the guide. Now you need to create a js file named `index.js` as entrance of your module. And write the basic lines of code:

```
module.exports = {
	//more code goes here
}
```

### 4 Declare models

The model module use [waterline](https://github.com/balderdashy/waterline)(a nodejs ORM) to build collections(or create tables) in your database automatically, the only thing you need to do is just write declaration like:

```
/* file: index.js*/

module.exports = {
  models:[{
    identity: 'post',
    attributes: {
      title : 'string',
      content : 'string',
      category : 'array'
    }
  }]
}
```

The code is quite self-explainable. For more details about the declaration please read waterline's document.

### 5 Add RESTful API and other advanced functions to models

Restful API for certain model can be generated once you assign the attribute `rest` to `true` in your model. And set `isNode` to `true` will enable brief auto generating for specified fields of the model. After the change your code would be like: 

```
/* file: index.js*/

module.exports = {
  models:[{
    identity: 'post',
    attributes: {
      title : 'string',
      content : 'string',
      category : 'array'
    },
    isNode : true,
    rest : true
  }]
}
```

Remeber these two extra lines of declaration works only if you declared the denpendcies of module `rest` and `node` in package.json like what we just did, or it will change nothing.

### 6 Add front-end files

Front-end files can served by both `theme` module and `statics` module. The diffrence between these two modules is that statics module servei file just as static resources while theme module do not only serving static file but also render template files like jade or ext with specified data. Add theme configuration to your code like:

```
module.exports = {
  models:[{
    identity: 'post',
    attributes: {
      title : 'string',
      content : 'string',
      category : 'array'
    },
    isNode : true,
    rest : true
  }],
  theme : {
    directory : "themes/default",
    mock : {
      "/post/:id" : "post.jade"
    },
    locals : {},
    index : "/blog/index"
  }
}
```

The `directory` attribute specifies the directory of your front-end files. For exmaple, the code above will map url `http://127.0.0.1:3000/twenty/someFile.html` to `/modules/blog/themes/default/someFile.html`.  
For mor information please dive into twenty's code or theme module's documents.

### Role-Based-Access-Control and other functions

Most zero modules are really easy to use with only a few lines of configuration. And there are already plenty of modules like `rbac`, `i18n`, `statistics` and so on, waiting you to explore.