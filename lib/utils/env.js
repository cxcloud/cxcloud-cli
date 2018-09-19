const path = require('path');
const fs = require('fs-extra');
const { runCommand, isWindows, logOperation } = require('./');

exports.installEnvironment = async () => {
  if (await fs.pathExists(path.join(process.cwd(), '.env'))) {
    logOperation('Environment already exists, skipped installation.');
    return;
  }
  await runCommand('python', ['-m', 'pip', 'install', '--user', 'virtualenv']);
  await runCommand('python', ['-m', 'virtualenv', './.env']);
  await runCommand(
    path.join(process.cwd(), '.env', isWindows() ? 'Scripts' : 'bin', 'pip'),
    [
      '-q',
      'install',
      '--upgrade',
      'git+https://github.com/makethunder/awsudo.git'
    ]
  );
};

exports.getSudoPath = () =>
  path.join(process.cwd(), '.env', isWindows() ? 'Scripts' : 'bin', 'awsudo');
