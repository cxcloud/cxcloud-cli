const inquirer = require('inquirer');
const fs = require('fs');
const untildify = require('untildify');
const execa = require('execa');
const { getRegions, getZones } = require('./utils');

module.exports = async (dir, cmd) => {
  const config = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      default: 'infra',
      message: 'Enter a DNS-compatible name for your project (all lowercase)'
    },
    {
      type: 'input',
      name: 'clusterDomain',
      validate: val => typeof val === 'string' && val.length > 0,
      message:
        'Enter a domain for your cluster configuration (eg. cluster.mysite.com)'
    },
    {
      type: 'input',
      name: 'workerCount',
      default: 2,
      filter: val => Number(val),
      message: 'How many workers do you need?'
    },
    {
      type: 'input',
      name: 'sshKey',
      default: '~/.ssh/id_rsa.pub',
      validate: dir => fs.lstatSync(untildify(dir)).isFile(),
      message: 'SSH Public Key Location'
    },
    {
      type: 'list',
      name: 'region',
      default: 'eu-west-1',
      choices: getRegions,
      message: 'AWS Zone'
    },
    {
      type: 'list',
      name: 'zone',
      default: 'eu-west-1a',
      choices: answers => getZones(answers.region),
      message: 'AWS Availability Zone'
    }
  ]);

  console.log(config);

  execa('kops', [
    'create',
    'cluster',
    `--name=${config.clusterDomain}`,
    '--state=s3://cxcloud-kops-test',
    `--zones=${config.zone}`,
    `--node-count=${config.workerCount}`,
    '--output=yaml',
    '--yes',
    '--dry-run'
  ]).then(res => console.log(res));
};
