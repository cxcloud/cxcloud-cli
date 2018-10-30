const yeoman = require('yeoman-environment');
const env = require('./utils/env');
const aws = require('./utils/aws');
const { showError } = require('./utils');

// Create a Yeoman environment so we can
// pass our commands to it.
const yo = yeoman.createEnv();
yo.register(require.resolve('generator-cxcloud'));

module.exports = async () => {
  try {
    await env.installEnvironment();
    await env.installRequirements();
    const repositories = await aws.getECRRepositories();
    yo.lookup(() => {
      yo.run('cxcloud:frontend', {repositories});
    });
  } catch (err) {
    showError(err.message);
  }
};
