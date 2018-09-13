const execa = require('execa');
const ora = require('ora');
const { logOperation } = require('./');

exports.installKops = async config => {
  logOperation('Creating a Kubernetes cluster...');

  const child = execa('kops', [
    'create',
    'cluster',
    `--name=${config.clusterDomain}`,
    `--state=s3://${config.projectName}`,
    `--zones=${config.zones.join(',')}`,
    `--node-count=${config.workerCount}`,
    `--ssh-public-key=${config.sshKey}`,
    '--yes'
  ]);

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  return child;
};

exports.validateKops = async config => {
  const spinner = ora('Validating cluster...').start();
  const startTime = new Date().getTime();
  const interval = 5000;
  const checker = async () => {
    // If more than 15 minutes has elapsed, fail the check
    const now = new Date().getTime();
    if ((now - startTime) / 1000 / 60 > 20) {
      spinner.fail(
        'Too much time has passed. Please validate the cluster manually or run the command again.'
      );
      return;
    }
    try {
      const { stdout } = await execa('kops', [
        'validate',
        'cluster',
        `--name=${config.clusterDomain}`,
        `--state=s3://${config.projectName}`,
        '--output=json'
      ]);
      const state = JSON.parse(stdout);
      if (
        Array.isArray(state.nodes) &&
        state.nodes.every(node => node.status === 'True')
      ) {
        spinner.succeed('Your cluster is now online.');
      } else {
        setTimeout(checker, interval);
      }
    } catch (err) {
      setTimeout(checker, interval);
    }
  };
  checker();
};
