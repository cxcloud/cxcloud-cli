const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const { getBinPath } = require('./env');
const { logOperation, sleep } = require('./');

function runKopsCommand(cmd, args) {
  return runCommandWithAWSCredentials('kops', [
    cmd,
    ...args
  ]);
}

exports.installKops = async (config, confirmed = false) => {
  logOperation('Checking to see if the cluster is already installed...');
  try {
    await runKopsCommand('validate', [
      'cluster',
      `--name=${config.clusterDomain}`,
      `--state=s3://${config.clusterDomain}`
    ]);
    logOperation('Cluster is already up and running... Skipping creation.');
    return;
  } catch (err) {}

  logOperation('Creating a Kubernetes cluster...');

  const args = [
    'cluster',
    `--name=${config.clusterDomain}`,
    `--state=s3://${config.clusterDomain}`,
    `--zones=${config.zones.join(',')}`,
    `--node-count=${config.workerCount}`,
    `--ssh-public-key=${config.sshKey}`,
    '--yes'
  ];

  if (!confirmed) {
    args.push('--dry-run', '--output=yaml');
  }

  const child = runKopsCommand('create', args);

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  return child;
};

exports.validateKops = async config => {
  const spinner = ora('Validating cluster...').start();
  const startTime = new Date().getTime();
  const checker = async () => {
    await sleep(3000);

    // If more than 20 minutes has elapsed, fail the check
    const now = new Date().getTime();
    if ((now - startTime) / 1000 / 60 > 20) {
      spinner.fail(
        'Too much time has passed. Please validate the cluster manually or run the command again.'
      );
      return;
    }
    try {
      const { stdout } = await runKopsCommand('validate', [
        'cluster',
        `--name=${config.clusterDomain}`,
        `--state=s3://${config.clusterDomain}`,
        '--output=json'
      ]);
      const state = JSON.parse(stdout);
      if (
        Array.isArray(state.nodes) &&
        state.nodes.every(node => node.status === 'True')
      ) {
        spinner.succeed('Your cluster is now online.');
      } else {
        await checker();
      }
    } catch (err) {
      await checker();
    }
  };
  await checker();
};

exports.writeKopsConfig = async yaml => {
  logOperation('Copying Kubernetes config...');
  await fs.outputFile(
    path.join(process.cwd(), './config/kubernetes.yaml'),
    yaml,
    'utf8'
  );
};
