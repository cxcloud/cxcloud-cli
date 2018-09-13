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

exports.createBucket = (bucketName, region) => {
  logOperation(`Creating an S3 bucket named: ${bucketName} in ${region}`);
  return execa.shell(
    `aws s3api create-bucket --bucket ${bucketName} --region ${region} --create-bucket-configuration LocationConstraint=${region}`
  );
};
