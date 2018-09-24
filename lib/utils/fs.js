const glob = require('glob');
const path = require('path');
const fs = require('fs-extra');
const ejs = require('ejs');

exports.copyTpl = (from, to, templateOpts = {}) => {
  const files = glob.sync(from);
  files.forEach(file => {
    const content = ejs.render(fs.readFileSync(file, 'utf8'), templateOpts);
    fs.outputFileSync(path.join(to, path.basename(file)), content);
  });
};
