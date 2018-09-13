const execa = require('execa');
const getStream = require('get-stream');
const { logOperation } = require('./');

exports.installKops = config => {
  logOperation('Creating a Kubernetes cluster...');

  const stream = execa('kops', [
    'create',
    'cluster',
    `--name=${config.clusterDomain}`,
    `--state=s3://${config.projectName}`,
    `--zones=${config.zones.join(',')}`,
    `--node-count=${config.workerCount}`,
    '--yes',
    '--output=yaml',
    '--dry-run'
  ]).stdout;

  stream.pipe(process.stdout);

  return getStream(stream);
};
