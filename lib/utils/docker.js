const execa = require('execa');
const fs = require('fs-extra');
const path = require('path');
const aws = require('./aws');
const { runCommand, logOperation } = require('./');

exports.dockerLogin = async () => {
  const command = await aws.getECRLogin();
  return execa.shell(command);
};

exports.dockerTag = async () => {
  const { name, version, ecr } = await fs.readJSON(
    path.join(process.cwd(), 'package.json')
  );
  const ecrParts = ecr.repository.split('/');
  const repoName = ecrParts.pop();

  logOperation('Building and pushing the docker image...');
  await runCommand('docker', [
    'build',
    '-t',
    `${repoName}:${name}-latest`,
    '.'
  ]);
  await runCommand('docker', [
    'tag',
    `${repoName}:${name}-latest`,
    `${ecr.repository}:${name}-latest`
  ]);
  await runCommand('docker', ['push', `${ecr.repository}:${name}-latest`]);
};
