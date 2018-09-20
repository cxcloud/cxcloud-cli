#!/usr/bin/env node
'use strict';

const program = require('commander');
const { showError } = require('./utils');
const pkg = require('../package.json');

if (process.platform === 'win32') {
  return showError('Windows is not supported.');
}

program
  .version(pkg.version)
  .command('generate [type]', 'code generator')
  .command('deploy', 'deploy the current application or service');

program.parse(process.argv);
