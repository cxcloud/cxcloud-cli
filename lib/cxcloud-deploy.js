#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const program = require('commander');
const { showError, logOperation, sleep } = require('./utils');
const env = require('./utils/env');
const docker = require('./utils/docker');
const kube = require('./utils/kube');

async function deploy(cmd) {
  try {
    await env.checkEnvironment();

    const config = await env.readDeploymentManifest();

    // Purge action
    if (cmd.purge) {
      logOperation('Purging deployment...');
      kube.deleteService(config, cmd.env);
      return;
    }

    // Deployment action
    if (config.deployment) {
      await env.ensureDeployEnvironment();
      await docker.dockerLogin();
      await docker.dockerTag(config);
    }

    await kube.deployService(config, cmd.env);

    logOperation('Waiting for deployment to be complete...');
    await sleep(5000); // 5 seconds

    if (config.routing) {
      console.log(`\n${chalk.green('Success! Your routing is now set up.')}`);
    }

    if (config.deployment) {
      console.log(`\n${chalk.green('Success! Your service is now deployed.')}`);
      console.log('You can see more information about it below:\n\n');
      await kube.getIngressInfo(config);
    }
  } catch (err) {
    console.log(err);
    showError(err);
  }
}

program
  .option(
    '-e, --env <env>',
    'Comma separated list of environment variables',
    input => input.split(',')
  )
  .option('-p, --purge', 'Purge the deployment')
  .action(deploy)
  .parse(process.argv);
