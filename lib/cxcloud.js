#!/usr/bin/env node
'use strict';

const program = require('commander');
const { showError } = require('./utils');
const pkg = require('../package.json');

if (!process.env.AWS_PROFILE) {
  showError(
    'You have to set `AWS_PROFILE` environment variable before continuing. Visit https://docs.cxcloud.com for help.'
  );
  return;
}

program
  .version(pkg.version)
  .command('generate [type]', 'code generator')
  .command('deploy', 'deploy the current application or service');

program.parse(process.argv);
