'use strict';

const path = require('path');
const fs = require('fs');
const ts = require('typescript');
const chalk = require('chalk');

require.extensions['.ts'] = function(m, filename) {
  const source = fs.readFileSync(filename).toString();

  try {
    const result = ts.transpile(source, {
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.CommonJs
    });

    return m._compile(result, filename);
  } catch (err) {
    throw err;
  }
};

const build = require('./lib/build');
const clean = require('./lib/clean');
const generateHtml = require('./lib/generate_html');
const copy = require('./lib/copy');
const css = require('./lib/css');
const server = require('./lib/server');
const gzip = require('./lib/gzip');
const tree = require('nodetree');

const args = process.argv.slice(2);

if (args[0] === 'build' || args[0] === 'b') {
  const cmd = new build.Build();

  switch (args[1]) {
    case 'dev':
      cmd.buildDev.subscribe(data => {
        console.info(data);
      }, err => {
        throw new Error(err);
      }, () => {
        console.log('Done.');
      });
      break;
    case 'prod':
      cmd.prodBuilder.subscribe(data => {
        console.info(data);
      }, err => {
        throw new Error(err);
      }, () => {
        console.log('Done.');
      });
      break;
    default:
      break;
  }
}

if (args[0] === 'clean') {
  clean.clean('dist').subscribe(data => {
    console.info(data);
  }, err => {
    throw new Error(err);
  }, () => {
    console.log('Done.');
  });
}

if (args[0] === 'gzip') {
  gzip.app().subscribe(data => {
    console.log(data)
  }, err => {
    console.log(err);
  }, () => {
    console.log('Done.');
  });
}

if (args[0] === 'serve' || args[0] === 'server' || args[0] === 's') {
  const cmd = new server.Server();
  cmd.watch.subscribe(data => {
    console.log(data);
  }, err => {
    throw new Error(err);
  }, () => {
    console.log('Done.');
  });
}

if (args[0] === 'dist') {
  const cmdBuild = new build.Build();
  const sassSrc = path.resolve(__dirname, '../src/styles/app.sass');
  const cssDest = path.resolve(__dirname, '../dist/css/app.css');
  
  let start = new Date();
  console.log(chalk.blue('Preparing project for production, please wait...'));
  console.log(chalk.yellow('-------------------------------------------------------'));

  clean.clean('dist')
  .concat(copy.copyPublic())
  .concat(generateHtml.generateProd())
  .concat(css.compileSass(sassSrc, cssDest))
  .concat(cmdBuild.buildProd)
  .concat(clean.clean('dist/src'))
  .concat(clean.clean('aot'))
  .concat(gzip.app()).subscribe(data => {
    console.log(data);
  }, err => {
    throw new Error(err);
  }, () => {
    let time = new Date().getTime() - start.getTime();
    console.log(chalk.yellow('-------------------------------------------------------'));
    tree(path.resolve(__dirname, '../dist'));
    console.log(chalk.yellow('-------------------------------------------------------'));
    console.log(chalk.green(`Project generated in ${time}ms.`));
  });
}

module.exports.build = build;
module.exports.clean = clean;
module.exports.generateHtml = generateHtml;
module.exports.copy = copy;
module.exports.css = css;
