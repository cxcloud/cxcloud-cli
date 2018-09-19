const execa = require('execa');
const path = require('path');
const { logOperation, isWindows } = require('./');

function runAWSCommand(cmd, args) {
  return execa(
    path.join(process.cwd(), '.env', isWindows() ? 'Scripts' : 'bin', 'awsudo'),
    ['-u', process.env.AWS_PROFILE, 'aws', cmd, ...args]
  );
}

exports.getRegions = async () => {
  const { stdout } = await runAWSCommand('ec2', [
    'describe-regions',
    '--query',
    'Regions[].{Name:RegionName}'
  ]);
  const regions = JSON.parse(stdout);
  return regions.map(region => region.Name);
};

exports.getZones = async region => {
  const { stdout } = await runAWSCommand('ec2', [
    'describe-availability-zones',
    `--region=${region}`,
    '--query',
    'AvailabilityZones[].{Name:ZoneName}'
  ]);
  const zones = JSON.parse(stdout);
  return zones.map(zone => zone.Name);
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
