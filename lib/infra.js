const inquirer = require('inquirer');
const fs = require('fs');
const untildify = require('untildify');
const execa = require('execa');
const { showError } = require('./utils');
const { getRegions, getZones, createBucket } = require('./utils/aws');
const { installKops, validateKops, writeKopsConfig } = require('./utils/kops');
const { installManifests, writeManifests } = require('./utils/kube');

module.exports = async cmd => {
  const questions = [
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
      type: 'checkbox',
      name: 'zones',
      default: ['eu-west-1a'],
      choices: answers => getZones(answers.region),
      message: 'AWS Availability Zone'
    }
  ].map(q => ({
    ...q,
    when(answers) {
      if (q.name in cmd) {
        answers[q.name] = cmd[q.name];
        return false;
      }
      return true;
    }
  }));

  const config = await inquirer.prompt(questions);

  try {
    await createBucket(config.projectName, config.region);
    const { stdout: kopsConfig } = await installKops(config);

    const { confirmed } = await inquirer.prompt([
      {
        name: 'confirmed',
        message:
          'Do you want to continue creating the cluster with these configurations?',
        type: 'confirm'
      }
    ]);
    if (!confirmed) {
      return;
    }
    await installKops(config, true);
    await validateKops(config);
    await installManifests(config);
    await writeKopsConfig(kopsConfig);
    await writeManifests();
  } catch (err) {
    showError(err.message);
  }
};
