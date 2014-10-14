#!/usr/bin/env node

var fs = require('fs'),
  fsExtra  = require('fs-extra'),
  async = require('async'),
  _  = require('lodash'),
  path = require('path'),
  tosource = require('tosource')

var program = require('commander');

program
  .version('0.0.1')
  .usage('zero command line')

require("./zero-update")(program)
require("./zero-install")(program)

program.parse(process.argv);

