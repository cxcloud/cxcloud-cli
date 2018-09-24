const path = require('path');
const { copyTpl } = require('./fs');

exports.writeTerraformConfig = async config => {
  copyTpl(
    path.join(__dirname, '../../templates/terraform/**/*'),
    process.cwd(),
    config
  );
};
