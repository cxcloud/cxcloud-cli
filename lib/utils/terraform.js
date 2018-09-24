const path = require('path');
const execa = require('execa');
const { getBinPath } = require('./env');
const { copyTpl } = require('./fs');

function runTerraformCommand(cmd, args = []) {
  const child = execa(getBinPath('awsudo'), [
    '-u',
    process.env.AWS_PROFILE,
    'terraform',
    cmd,
    ...args
  ]);
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  return child;
}

exports.writeTerraformConfig = async config => {
  copyTpl(
    path.join(__dirname, '../../templates/terraform/**/*'),
    process.cwd(),
    config
  );
};

exports.initTerraform = async () => {
  return runTerraformCommand('init');
};

exports.planTerraform = async () => {
  return runTerraformCommand('plan');
};

exports.applyTerraform = async () => {
  return runTerraformCommand('apply', ['-auto-approve']);
};
