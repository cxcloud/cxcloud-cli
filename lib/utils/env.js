const path = require('path');
const fs = require('fs-extra');
const { runCommand, logOperation } = require('./');

const getBinPath = bin => path.join(__dirname, '../../.env/bin', bin);

exports.installEnvironment = async () => {
  if (await fs.pathExists(path.join(__dirname, '../../.env'))) {
    logOperation('Environment already exists, skipped installation.');
    return;
  }
  await runCommand('python', ['-m', 'pip', 'install', '--user', 'virtualenv']);
  await runCommand('python', [
    '-m',
    'virtualenv',
    path.join(__dirname, '../../.env')
  ]);
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

exports.ensureDeployEnvironment = async () => {
  const paths = ['./package.json', './deployment/01-deployment.yml'];
  const allExist = paths.every(dir =>
    fs.existsSync(path.join(process.cwd(), dir))
  );
  if (!allExist) {
    throw new Error('Please navigate to a service directory.');
  }
  const json = await fs.readJSON(path.join(process.cwd(), 'package.json'));
  if (!json || !json.ecr || !json.ecr.repository) {
    throw new Error(
      'Your package.json file does not include ECR repository information'
    );
  }
};
