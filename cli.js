#!/usr/bin/env node
'use strict';

const meow = require('meow');
const { showError } = require('./utils');
const yeoman = require('yeoman-environment');

// Map cli types to Yeoman types
const availbleTypes = {
  microservice: 'app',
  infra: 'infra'
};

// Create a Yeoman environment so we can
// pass our commands to it.
const env = yeoman.createEnv();
env.register(require.resolve('generator-cxcloud'));

const cli = meow(`
  Usage
    $ cxcloud generate <type>
    $ cxcloud generate <type>:<subtype>

  Examples
    $ cxcloud generate microservice
    $ cxcloud generate microservice:controller
    $ cxcloud generate infra
`);

if (cli.input.length < 2) {
  return cli.showHelp();
}

const [_, commandStr] = cli.input; // for now we ignore the first argument since it's always `generate`
const [type, subtype] = commandStr.split(':');

if (!(type in availbleTypes)) {
  showError('The specified command does not exist.');
}

env.run(`cxcloud:${availbleTypes[type]}`);
