const execa = require('execa');
const fs = require('fs-extra');
const path = require('path');
const aws = require('./aws');
const { runCommand, logOperation } = require('./');

exports.dockerLogin = async () => {
  const command = await aws.getECRLogin();
  return execa.shell(command);
};

exports.dockerTag = async config => {
  const { name, version, repository } = config.deployment.image;
  const ecrParts = repository.split('/');
  const repoName = ecrParts.pop();

  logOperation('Building and pushing the docker image...');
  await runCommand('docker', [
    'build',
    '-t',
    `${repoName}:${name}-${version}`,
    '.'
  ]);
  await runCommand('docker', [
    'tag',
    `${repoName}:${name}-${version}`,
    `${repository}:${name}-${version}`
  ]);
  await runCommand('docker', ['push', `${repository}:${name}-${version}`]);
};
