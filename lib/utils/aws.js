const execa = require('execa');
const path = require('path');
const awsRegions = require('aws-regions');
const { getBinPath } = require('./env');
const { logOperation } = require('./');

function runAWSCommand(cmd, args) {
  return execa(getBinPath('awsudo'), [
    '-u',
    process.env.AWS_PROFILE,
    getBinPath('aws'),
    cmd,
    ...args
  ]);
}

exports.getRegions = () => {
  return awsRegions.list({ public: true }).map(region => region.code);
};

exports.getZones = region => {
  return awsRegions.get(region).zones;
};

exports.createBucket = async (bucketName, region) => {
  logOperation(`Creating an S3 bucket named: ${bucketName} in ${region}`);
  try {
    await runAWSCommand('s3api', [
      'create-bucket',
      `--bucket=${bucketName}`,
      `--region=${region}`,
      '--create-bucket-configuration',
      `LocationConstraint=${region}`
    ]);
  } catch (err) {
    // If the bucket already exists we dont want to throw an error.
    if (err.message.indexOf('BucketAlreadyOwnedByYou') < 0) {
      throw new Error(err.message);
    }
    logOperation('The bucket already exists. Skipped creation.');
  }
};

exports.getECRRepositories = async () => {
  const { stdout } = await runAWSCommand('ecr', ['describe-repositories']);
  const { repositories } = JSON.parse(stdout);
  return repositories.map(repo => repo.repositoryUri);
};
