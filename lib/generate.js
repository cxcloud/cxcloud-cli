const yeoman = require('yeoman-environment');
const { showError } = require('../utils');

// Map cli types to Yeoman types
const availbleTypes = {
  microservice: 'app',
  infra: 'infra'
};

// Create a Yeoman environment so we can
// pass our commands to it.
const env = yeoman.createEnv();
env.register(require.resolve('generator-cxcloud'));

module.exports = function(commandStr) {
  const [type, subtype] = commandStr.split(':');

  if (!(type in availbleTypes)) {
    showError('The specified command does not exist.');
  }

  env.run(`cxcloud:${availbleTypes[type]}`);
};
