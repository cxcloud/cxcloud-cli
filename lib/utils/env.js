const path = require('path');
const fs = require('fs-extra');
const YAML = require('js-yaml');
const Joi = require('joi');
const chalk = require('chalk');
const { runCommand, logOperation, showError } = require('./');
const { deploymentManifestSchema } = require('./schemas');
const { checkForUpdates } = require('./update');
const execa = require('execa');

const getBinPath = bin => path.join(__dirname, '../../.env/bin', bin);

const envAWSKeysExist = function() {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
  return AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY;
}

const installEnvironment = async () => {
  if (await fs.pathExists(path.join(__dirname, '../../.env'))) {
    logOperation('Environment already exists, skipping installation.');
    return;
  }
  await runCommand('python', ['-m', 'pip', 'install', '--user', 'virtualenv']);
  await runCommand('python', [
    '-m',
    'virtualenv',
    path.join(__dirname, '../../.env')
  ]);
};

const installRequirements = async () => {
  if (envAWSKeysExist()) {
    logOperation('AWS API key environment variables is set, `awsudo` not needed.');
    return;
  }
  if (await fs.pathExists(getBinPath('awsudo'))) {
    logOperation('`awsudo` exists, skipping installation.');
    return;
  }
  logOperation('Installing `awsudo`...');
  await runCommand(getBinPath('pip'), [
    '-q',
    'install',
    '--upgrade',
    'git+https://github.com/makethunder/awsudo.git'
  ]);
};

exports.checkEnvironment = async () => {
  if (!process.env.AWS_PROFILE && !envAWSKeysExist()) {
    return showError(
      'Some environment variables has to be set before running cxcloud. Visit https://docs.cxcloud.com for help.'
    );
  }

  await checkForUpdates();
  await installEnvironment();
  await installRequirements();
};

exports.runCommandWithAWSCredentials = (cmd, args) => {
  if (envAWSKeysExist()) {
    return execa(getBinPath(cmd), [
      ...args
    ]);
  } else {
    return execa(getBinPath('awsudo'), [
      '-u',
      process.env.AWS_PROFILE,
      getBinPath(cmd),
      ...args
    ]);
  }
}

exports.getBinPath = getBinPath;

exports.ensureDeployEnvironment = async () => {
  logOperation('Ensuring we are in a deployable directory...');
  const paths = ['./Dockerfile', './.cxcloud.yaml'];
  const allExist = paths.every(dir =>
    fs.existsSync(path.join(process.cwd(), dir))
  );
  if (!allExist) {
    showError(
      'Dockerfile and .cxcloud.yaml files are required for deployment.'
    );
  }
};

exports.readDeploymentManifest = async () => {
  logOperation('Reading deployment manifest...');
  let configText = await fs.readFile(
    path.join(process.cwd(), '.cxcloud.yaml'),
    'utf-8'
  );
  const pkg = await fs
    .readJSON(path.join(process.cwd(), 'package.json'))
    .catch(() => ({
      notFound: true,
      name: null,
      version: null
    }));
  const macros = {
    APP_VERSION: pkg.version,
    APP_NAME: pkg.name,
    ...process.env
  };
  Object.keys(macros).forEach(key => {
    configText = configText.replace(
      new RegExp(`\\$${key}\\b`, 'g'),
      macros[key]
    );
  });
  const yamlConfig = YAML.safeLoad(configText);
  const { deployment } = yamlConfig;

  const { error, value } = Joi.validate(yamlConfig, deploymentManifestSchema, {
    abortEarly: false
  });

  if (error) {
    error.details.forEach(detail => {
      console.log(`${chalk.red(detail.message)} [${detail.path.join('.')}]`);
    });
    showError('Deployment schema validation failed.');
  }

  return {
    pkg,
    ...yamlConfig
  };
};
