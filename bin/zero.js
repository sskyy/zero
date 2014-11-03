#!/usr/bin/env node

var program = require('commander');

program
  .version('0.0.1')
  .usage('zero command line')

require("./zero-update")(program)
require("./zero-upgrade")(program)
require("./zero-install")(program)
require("./zero-package")(program)
require("./zero-new")(program)

program.parse(process.argv);

