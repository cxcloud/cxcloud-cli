#!/usr/bin/env node
'use strict';

const meow = require('meow');
const { showError } = require('./utils');
const generate = require('./lib/generate');

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

console.log(cli);
const [commandType, commandStr] = cli.input;

switch (commandType) {
  case 'generate':
    return generate(commandStr);
  default:
    showError(`Command '${commandType}' does not exist.`);
}
