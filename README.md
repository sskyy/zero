
[![npm version](https://badge.fury.io/js/zero.png)](http://badge.fury.io/js/zero)
[![Build Status](https://travis-ci.org/sskyy/zero.svg?branch=master)](https://travis-ci.org/sskyy/zero)

## 简介

[http://www.zerojs.io](http://zerojs.io)。  
zero 是一个基于 node.js 的 web 开发框架。它能帮助你快速地开发博客、论坛、商城等系统。它的特点在于:

 - 底层功能完整。zero利用 express、waterline 等开源库和框架实现了ORM、文件上传、session、websocket等底层功能。
 - 模块机制强大。zero的模块运行机制实现了模块声明即可用，告别复杂的api调用。
 - 使用 *面向系统事件* 取代 *面向接口* 的架构方式，让代码能更好地反映业务逻辑。默认提供的开发组件甚至能将系统间的调用可视化。

 
## 快速试用

以下代码展示使用 zero 快速安装一个基于 zero 开发的博客系统 [twenty](http://twentyjs.com).


```
npm install zero
zero new blog
cd blog
zero install twenty

...waiting for twenty install...

cp modules/twenty/config.sample.js modules/twenty/config.js
node app
```

## 开发指南

 - 快速开发一个博客
 - 快速开发一个论坛
 - 快速开发一个聊天室
 - 常用模块



