[![npm version](https://badge.fury.io/js/zero.png)](http://badge.fury.io/js/zero)
[![Build Status](https://travis-ci.org/sskyy/zero.svg?branch=master)](https://travis-ci.org/sskyy/zero)

## 1 Introduction

Zero is a node.js web framework. It can help you build website or application in an extremely easy way.
There are two main features make zero different from other framework:

### 1.1 Behavior based module system

Related modules does not related in code level, but in system behavior level. That means in most case module can be added or removed without changing related module's codes, and system may still working well.
 
### 1.2 Using event to build system logic

Zero has several powerful module to help you build your system using event.  So module can loose couple easily. What is more amazing is that zero dev tool can trace the event fire stack for every request and make a graph for you.


## 2 Quick start

You can use codes below to install a blog system [twenty](http://twentyjs.com) based on zero .


```
>  npm install zero -g
>  zero new blog
>  cd blog
>  zero install twenty

...waiting for twenty install...

>  cp modules/twenty/config.sample.js modules/twenty/config.js
>  node app
```

If you are a developer, we strongly suggest you to install dev tool to explore the system.


```
>  zero install dev //in root of your application
```

Simply visit http://localhost:3000/dev/index.html to open dev tool.

Other packages to play with:

 - [nine](http://github.com/sskyy/zero-nine) A GTD application integrated with tomato clock. Remember remove twenty before install it, this module use multiple user system which may conflict with twenty.
 - [color](http://github.com/hi-caicai/color) A simple application for you to create your own color wall. Conflict with twenty too.

## 3 basic usage

### 3.1 Creating application ###

Run `zero new <app_name>` in any directory.

### 3.2 Installing zero module ###

Simply execute `zero install <module_name>` in root of you application.

### 3.3 Creating zero module ###

Zero module follow the standard npm package rules, the only restrict is that you should name your module name start with `zero-` in package.json.

### 3.4 Using other zero module as dependency ###

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

## 4 developer guide

We strongly suggest you explore the code of [twenty](http://github.com/sskyy/zero-twenty), which used the most of zero popular modules.
And install zero dev tool to see the real advantage of using zero.
We will soon release a complete developer guide for building blog, forum and other popular type of website.







