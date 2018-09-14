const execa = require('execa');
const path = require('path');
const ora = require('ora');

const manifest = name =>
  path.resolve(__dirname, `../../manifests/${name}.yaml`);

exports.installManifests = async config => {
  const spinner = ora('Configuring the cluster for you...').start();

  spinner.text = 'Configuring Role-based Access Control...';
  await execa('kubectl', ['apply', '-f', manifest('rbac')]);

  spinner.text = 'Installing Tiller on the cluster...';
  await execa('helm', ['init', '--service-account', 'tiller']);

  spinner.text = 'Installing the load balancer...';
  await execa('helm', [
    'install',
    'stable/nginx-ingress',
    '--set',
    'rbac.create=true',
    '--name',
    'nginx-ingress'
  ]);

  spinner.text = 'Installing the certificate manager...';
  await execa('helm', [
    'install',
    'stable/cert-manager',
    '--namespace',
    'kube-system',
    '--name',
    'cert-manager'
  ]);

  spinner.text = 'Creating LetsEncrypt issuers...';
  await execa('kubectl', ['apply', '-f', manifest('letsencrypt-production')]);
  await execa('kubectl', ['apply', '-f', manifest('letsencrypt-staging')]);

  spinner.text = 'Creating a namespace.';
  await execa('kubectl', ['apply', '-f', manifest('namespace')]);

  spinner.succeed('Configuration successful.');
};
