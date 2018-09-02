#!/usr/bin/env node
'use strict';

const program = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .command('generate [type]', 'code generator')
  .command('deploy', 'deploy the current application or service')
  .parse(process.argv);
