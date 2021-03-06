const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const execa = require('execa');

const logOperation = str => {
  console.log(`${chalk.blue('Info:')} ${str}`);
};

exports.showError = str => {
  console.error(
    `${chalk.red('Error:')} ${str} Check ${chalk.yellow(
      'cxcloud --help'
    )} for usage.`
  );
  process.exit(1);
};

exports.logOperation = logOperation;

exports.sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

exports.writeProjectStructure = async () => {
  logOperation('Copying project structure...');
  await fs.copy(
    path.join(__dirname, '../../templates/structure/gitignore.template'),
    path.join(process.cwd(), './.gitignore')
  );
};

exports.runCommand = (cmd, args, options = {}) => {
  const exec = execa(cmd, args, options);
  exec.stdout.pipe(process.stdout);
  exec.stderr.pipe(process.stderr);
  return exec;
};
