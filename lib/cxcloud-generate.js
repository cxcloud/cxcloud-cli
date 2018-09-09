const program = require('commander');
const yeoman = require('yeoman-environment');
const { showError } = require('./utils');

// Create a Yeoman environment so we can
// pass our commands to it.
const env = yeoman.createEnv();
env.register(require.resolve('generator-cxcloud'));

program
  .command('service')
  .description('generates a NodeJS microservice')
  .action((dir, cmd) => {
    env.run('cxcloud:app');
  });

program
  .command('infra')
  .description('generates a Terraform infrastructure for running Microservices')
  .action((dir, cmd) => {
    showError('Not implemented yet.');
  });

program.parse(process.argv);
