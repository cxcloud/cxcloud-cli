#!/usr/bin/env node
'use strict';

const program = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .command('generate [type]', 'code generator')
  .command('deploy [action]', 'deploy the current application or service');

program.parse(process.argv);
