let Site = require('./Site.js');

// 帮助信息
function showHelp() {
  console.log('使用方法：');
  console.log(' -d  --domain\t设定域名');
  console.log(' -o  --out\t目标目录');
  console.log(' -w  --watch\t开启监听');
  console.log(' -s  --src\t源目录');
  console.log(' -v  --version\t显示版本号并退出');
  console.log(' -h  --help\t显示帮助信息并退出');
};

// 整理参数
function argument() {

  // 设定默认值
  let key = null;
  let arg = {
    watch: null,
    out: null,
    domain: null
  };

  process.argv.forEach(function(item) {
    switch (item) {
      case '-o':
      case '--out':
        key = 'out';
        return;

      case '-d':
      case '--domain':
        key = 'domain';
        return;

      case '-s':
      case '--src':
        key = 'src';
        return;

      case '-w':
      case '--watch':
        arg['watch'] = true;
        return;

      case '-v':
      case '--version':
        console.log('version 0.1 copyright 2017 JamesWatson');
        process.exit(0);

      case '-h':
      case '--help':
        showHelp();
        process.exit(0);
      default:
        break;
    }

    switch (key) {
      case 'domain':
        arg[key] = item;
        key = null;
      break;

      case 'out':
        let foo = item;

        if (!path.isAbsolute(item)) {
          let pwd = fs.realpathSync('.');
          foo = path.normalize(path.join(pwd, item));
        }

        arg[key] = foo.length ? foo : pwd;
        key = null;
        break;

      case 'src':
        let foo = item;

        if (!path.isAbsolute(item)) {
          let pwd = fs.realpathSync('.');
          foo = path.normalize(path.join(pwd, item));
        }

        arg[key] = foo.length ? foo : pwd;
        key = null;
        break;
      case null:
      default:
        break;
    }
  });

  return arg;
}

function main(args) {
  let site = new Site(args['domain'], args['src']);

  site.on('map', () => {
    console.log(site.mapper);
  });

  site.map();
  return 0;
}

process.exit(main(argument()));