const chalk = require('chalk');

exports.showError = str => {
  console.error(
    `${chalk.red('Error:')} ${str} Check ${chalk.yellow(
      'cxcloud --help'
    )} for usage.`
  );
  process.exit(1);
};
