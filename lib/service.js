const yeoman = require('yeoman-environment');
const env = require('./utils/env');
const aws = require('./utils/aws');
const { showError } = require('./utils');

// Create a Yeoman environment so we can
// pass our commands to it.
const yo = yeoman.createEnv();
yo.register(require.resolve('generator-cxcloud'));

module.exports = async () => {
  if (!process.env.AWS_PROFILE) {
    return showError(
      'You have to set `AWS_PROFILE` environment variable before continuing. Visit https://docs.cxcloud.com for help.'
    );
  }

  try {
    await env.installEnvironment();
    await env.installRequirements();
    const repositories = await aws.getECRRepositories();
    yo.run('cxcloud:app', {
      repositories
    });
  } catch (err) {
    showError(err.message);
  }
};
