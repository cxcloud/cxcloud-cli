const yeoman = require('yeoman-environment');
const { showError } = require('../utils');

// Create a Yeoman environment so we can
// pass our commands to it.
const yo = yeoman.createEnv();
yo.register(require.resolve('generator-cxcloud'));

module.exports = async generationType => {
  try {
    yo.lookup(() => {
      yo.run(`cxcloud:${generationType}`);
    });
  } catch (err) {
    showError(err.message);
  }
};
