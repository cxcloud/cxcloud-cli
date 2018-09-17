const program = require('commander');
const yeoman = require('yeoman-environment');
const { showError } = require('./utils');
const infraHandler = require('./infra');

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
  .option('-n, --project-name <name>', 'Project name')
  .option('-d, --cluster-domain <domain>', 'Cluster domain')
  .option('-c, --worker-count <count>', 'Worker count', parseInt)
  .option('-i, --ssh-key <key>', 'SSH public key')
  .option('-r, --region <region>', 'AWS Region')
  .option('-z, --zones <zones>', 'AWS Availability Zones', list =>
    list.split(',')
  )
  .action(infraHandler);

program.parse(process.argv);
