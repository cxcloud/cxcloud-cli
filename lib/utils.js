const chalk = require('chalk');
const execa = require('execa');

exports.showError = str => {
  console.error(
    `${chalk.red('Error:')} ${str} Check ${chalk.yellow(
      'cxcloud --help'
    )} for usage.`
  );
  process.exit(1);
};

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
