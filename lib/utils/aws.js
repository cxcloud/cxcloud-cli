const execa = require('execa');
const { logOperation } = require('./');

exports.getRegions = async () => {
  const { stdout } = await execa.shell(
    'aws ec2 describe-regions --query "Regions[].{Name:RegionName}" --output text'
  );
  return stdout.trim().split('\n');
};

exports.getZones = async region => {
  const { stdout } = await execa.shell(
    `aws ec2 describe-availability-zones --region ${region} --query "AvailabilityZones[].{Name:ZoneName}" --output text`
  );
  return stdout.trim().split('\n');
};

exports.createBucket = async (bucketName, region) => {
  logOperation(`Creating an S3 bucket named: ${bucketName} in ${region}`);
  try {
    await execa.shell(
      `aws s3api create-bucket --bucket ${bucketName} --region ${region} --create-bucket-configuration LocationConstraint=${region}`
    );
  } catch (err) {
    // If the bucket already exists we dont want to throw an error.
    if (err.message.indexOf('BucketAlreadyOwnedByYou') < 0) {
      throw new Error(err.message);
    }
    logOperation('The bucket already exists. Skipped creation.');
  }
};
