const execa = require('execa');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const path = require('path');
const Cache = require('persistent-cache');
const pkg = require('../../package.json');

const CACHE_KEY = 'checkedForUpdates';
const cache = Cache({
  base: path.join(__dirname, '../../.cache'),
  duration: 1000 * 3600 * 12 // half a day
});

exports.checkForUpdates = async () => {
  if (cache.getSync(CACHE_KEY)) {
    return;
  }
  const spinner = ora('Checking for updates...').start();
  const { stdout } = await execa('npm', ['info', pkg.name, '--json']);
  const info = JSON.parse(stdout);
  const latest = info['dist-tags'].latest;
  spinner.succeed();
  cache.putSync(CACHE_KEY, true);

  if (pkg.version !== latest) {
    console.log(
      boxen(
        `A new version of ${chalk.greenBright(
          'cxcloud'
        )} is available.\nInstall it now: ${chalk.greenBright(
          'npm i -g cxcloud@latest'
        )}`,
        { padding: 1, margin: 1, borderStyle: 'double' }
      )
    );
  }
};
