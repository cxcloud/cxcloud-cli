const { runCommand, isWindows } = require('./');
const path = require('path');

exports.installEnvironment = async () => {
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
