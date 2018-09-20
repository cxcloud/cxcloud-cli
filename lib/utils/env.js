const path = require('path');
const fs = require('fs-extra');
const { runCommand, logOperation } = require('./');

const getBinPath = bin => path.join(process.cwd(), '.env/bin', bin);

exports.installEnvironment = async () => {
  if (await fs.pathExists(path.join(process.cwd(), '.env'))) {
    logOperation('Environment already exists, skipped installation.');
    return;
  }
  await runCommand('python', ['-m', 'pip', 'install', '--user', 'virtualenv']);
  await runCommand('python', ['-m', 'virtualenv', './.env']);
};

exports.installRequirements = async () => {
  await runCommand(getBinPath('pip'), [
    '-q',
    'install',
    '--upgrade',
    'git+https://github.com/makethunder/awsudo.git'
  ]);
};

exports.getBinPath = getBinPath;
