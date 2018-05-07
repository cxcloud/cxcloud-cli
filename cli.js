#!/usr/bin/env node
'use strict';

const meow = require('meow');
const { showError } = require('./utils');

// Map cli types to Yeoman types
const availbleTypes = {
  microservice: 'app',
  infra: 'infra'
};

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
  showError('Not enough arguments specified.');
}

const [_, commandStr] = cli.input; // for now we ignore the first argument since it's always `generate`
const [type, subtype] = commandStr.split(':');

if (!(type in availbleTypes)) {
  showError('The specified command does not exist.');
}
