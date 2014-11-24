
[![npm version](https://badge.fury.io/js/zero.png)](http://badge.fury.io/js/zero)
[![Build Status](https://travis-ci.org/sskyy/zero.svg?branch=master)](https://travis-ci.org/sskyy/zero)

## Introduction

[http://www.zerojs.io](http://zerojs.io)。  
Zero is a node.js web framework. It can help you build website or application in an extremely easy way.
There are two main features make zero different from other framework:

 - Behavior based module system.
 - Using event to build system logic.

 
## Quick start

You can use codes below to install a blog system [twenty](http://twentyjs.com) based on zero .


```
npm install zero -g
zero new blog
cd blog
zero install twenty

...waiting for twenty install...

cp modules/twenty/config.sample.js modules/twenty/config.js
node app
```

## basic usage

### Creating application ###

Run `zero new <app_name>` in any directory.

### Installing zero module ###

Simply execute `zero install <module_name>` in root of you application.

### Creating zero module ###

Zero module follow the standard npm package rules, the only restrict is that you should name your module name start with `zero-` in package.json.

### Using other zero module as dependency ###

Declare zero dependency in package.json like:

```
{
  "name":"zero-YOUR_MODULE_NAME",
  "zero":{
    "dependencies":{
      "DEPEND_MODULE" : "VERSION"
    }
  }
}
```

When zero start, it will call all dependency modules' `expand` method, and pass current module instance to it, so dependency may extend current module's behavior.

## develop resources

 - How to develop a blog.
 - How to develop a forum
 - How to develop a chatroom.
 - Popular modules.



