#!/usr/bin/env node
'use strict';

const program = require('commander');
const { showError } = require('./utils');
const serviceHandler = require('./service');
const infraHandler = require('./infra');
const demoHandler = require('./demo');

program
  .command('demo')
  .description('generates Angular or React demo')
  .action(demoHandler);

program
  .command('service')
  .description('generates a NodeJS microservice')
  .action(serviceHandler);

program
  .command('infra')
  .description('generates a Terraform infrastructure for running Microservices')
  .option('-d, --cluster-domain <domain>', 'Cluster domain')
  .option('-c, --worker-count <count>', 'Worker count', parseInt)
  .option('-i, --ssh-key <key>', 'SSH public key')
  .option('-r, --region <region>', 'AWS Region')
  .option('-z, --zones <zones>', 'AWS Availability Zones', list =>
    list.split(',')
  )
  .action(infraHandler);

program.parse(process.argv);
