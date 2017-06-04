let path = require('path');
let fs = require('fs');
let Site = require('./Site.js');
let option = require('./option.js');

// 帮助信息
function showHelp() {
  console.log('使用方法：');
  console.log(' -d  --domain\t设定域名');
  console.log(' -o  --out\t目标目录');
  console.log(' -w  --watch\t开启监听');
  console.log(' -s  --src\t源目录');
  console.log(' -v  --version\t显示版本号并退出');
  console.log(' -h  --help\t显示帮助信息并退出');
  return 0;
};

function toAbsolute(cwd, value) {
  let foo = value;

  if (!path.isAbsolute(value)) {
    foo = path.normalize(path.join(cwd, value));
  }

  return foo.length ? foo : cwd;
}


function main(args) {
  if (args['version']) {
    return console.log('fe-builder 0.1 (C) JamesWatson');
  }

  if (args['help']) {
    return showHelp();
  }

  if (!args.out || '' === args.out || !args.default || '' === args.default || !args.domain || '' === args.domain) {
    return showHelp();
  }

  let cwd = fs.realpathSync('.');
  args['default'] = toAbsolute(cwd, args['default']);
  args['out'] = toAbsolute(cwd, args['out']);

  let site = new Site(args['domain'], args['default']);

  site.on('map', () => {
    for (let [index, info] of site.mapper) {
      switch (info.type) {
        case '.less':

          break;
        case '.es6':

          break;
      }
    }
  });

  site.map();
  return 0;
}

main(option([{
  opt: 'v',
  option: 'version',
  argument: false
}, {
  opt: 'h',
  option: 'help',
  argument: false
}, {
  opt: 'w',
  option: 'watch',
  argument: false
}, {
  opt: 'o',
  option: 'out',
  argument: true
}, {
  opt: 'd',
  option: 'domain',
  argument: true
}]));