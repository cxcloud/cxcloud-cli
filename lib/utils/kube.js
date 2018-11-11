const execa = require('execa');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');
const fs = require('fs-extra');
const { sleep, logOperation, runCommand } = require('./');
const { buildDeploymentYaml } = require('./deployment');

const manifest = name =>
  path.resolve(__dirname, `../../templates/manifests/${name}.yaml`);

const getLoadBalancerUrl = async config => {
  const data = await execa.stdout('kubectl', [
    'get',
    'service',
    'nginx-ingress-controller',
    `-o=jsonpath='{.status.loadBalancer.ingress[0].hostname}'`
  ]);

  return data;
};

const skipHelmInstallation = async fn => {
  try {
    await fn;
  } catch (err) {
    if (err.message.includes('already exists')) {
      return;
    }
    throw err;
  }
};

exports.installManifests = async config => {
  const spinner = ora('Configuring the cluster for you...').start();
  await sleep(30000); // Half a minute

  spinner.text = 'Configuring Role-based Access Control...';
  await execa('kubectl', ['apply', '-f', manifest('rbac')]);

  spinner.text = 'Installing Tiller on the cluster...';
  await execa('helm', ['init', '--service-account', 'tiller']);

  spinner.text = 'Waiting for Tiller to become available...';
  await sleep(60000); // 1 minute

  spinner.text = 'Installing the load balancer...';
  await skipHelmInstallation(
    execa('helm', [
      'install',
      'stable/nginx-ingress',
      '--set',
      'rbac.create=true',
      '--name',
      'nginx-ingress'
    ])
  );

  spinner.text = 'Installing the certificate manager...';
  await skipHelmInstallation(
    execa('helm', [
      'install',
      'stable/cert-manager',
      '--namespace',
      'kube-system',
      '--name',
      'cert-manager'
    ])
  );

  spinner.text = 'Creating LetsEncrypt issuers...';
  await execa('kubectl', ['apply', '-f', manifest('letsencrypt-production')]);
  await execa('kubectl', ['apply', '-f', manifest('letsencrypt-staging')]);

  spinner.text = 'Creating a namespace.';
  await execa('kubectl', ['apply', '-f', manifest('namespace')]);

  await sleep(10000); // 10 seconds

  spinner.succeed('Configuration successful.');

  logOperation('Getting Load Balancer Hostname...');
  console.log(
    `${chalk.green('Load Balancer Hostname:')} ${await getLoadBalancerUrl(
      config
    )}`
  );
};

exports.writeManifests = async () => {
  logOperation('Copying Kubernetes manifests...');
  await fs.ensureDir(path.join(process.cwd(), './manifests'));
  await fs.copy(
    path.join(__dirname, '../../templates/manifests/'),
    path.join(process.cwd(), './manifests/')
  );
};

exports.deployService = async (config, envList) => {
  logOperation('Deploying to cluster...');
  const manifest = buildDeploymentYaml(config, envList);
  return runCommand('kubectl', ['apply', '-f', '-'], {
    input: manifest
  });
};

exports.getIngressInfo = async config => {
  const { name } = config.deployment;
  return runCommand('kubectl', [
    'describe',
    'ingress',
    name,
    '-n',
    'applications'
  ]);
};
