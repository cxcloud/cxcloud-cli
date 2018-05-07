#!/usr/bin/env node
"use strict";

const meow = require("meow");

const cli = meow(`
  Usage
    $ cxcloud-cli <input>

  Options
    --name  Lorem ipsum [Default: false]

  Examples
    $ cxcloud-cli
    I love Ink
    $ cxcloud-cli --name=ponies
    I love ponies
`);

console.log(cli);
