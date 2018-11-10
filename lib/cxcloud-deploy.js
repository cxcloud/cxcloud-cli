#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const { showError, logOperation, sleep } = require('./utils');
const env = require('./utils/env');
const docker = require('./utils/docker');
const kube = require('./utils/kube');

(async () => {
  try {
    await env.ensureDeployEnvironment();
    await env.installEnvironment();
    await env.installRequirements();

    const config = await env.readDeploymentManifest();

    await docker.dockerLogin();
    await docker.dockerTag(config);
    await kube.deployService(config);

    logOperation('Waiting for deployment to be complete...');
    await sleep(5000); // 5 seconds

    console.log(`\n${chalk.green('Success! Your service is now deployed.')}`);
    console.log('You can see more information about it below:\n\n');
    await kube.getIngressInfo(config);
  } catch (err) {
    showError(err);
  }
})();
