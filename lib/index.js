let path = require('path');
let fs = require('fs');
let Site = require('./Site.js');
let option = require('./option.js');
let File = require('./File.js');
let Font = require('./Font.js');
let Style = require('./Style.js');
let Script = require('./Script.js');

// 帮助信息
function showHelp() {
  console.log('使用方法：');
  console.log(' -d  --domain\t设定域名');
  console.log(' -o  --out\t目标目录');
  console.log(' -w  --watch\t开启监听');
  console.log(' -s  --src\t源目录');
  console.log(' -v  --version\t显示版本号并退出');
  console.log(' -h  --help\t显示帮助信息并退出');
  process.exit(0);
};

// 转换绝对路径
function toAbsolute(cwd, value) {
  let foo = value;

  if (!path.isAbsolute(value)) {
    foo = path.normalize(path.join(cwd, value));
  }

  return foo.length ? foo : cwd;
}

// 参数检查
function argCheck(args, cwd = '.') {
  if (args['version']) {
    console.log('fe-builder 0.1 (C) 2017 JamesWatson LICENSE GPL2.0');
    process.exit(0);
  }

  if (args['help'] || !args.out || '' === args.out || !args.default || '' === args.default || !args.domain || '' === args.domain) {
    showHelp();
  }

  cwd = fs.realpathSync(cwd);
  args['default'] = toAbsolute(cwd, args['default']);
  args['out'] = toAbsolute(cwd, args['out']);
}

// 编译字体文件
function mkFont(input, incName, outFontFile, outCssFile, callback) {
  let iconFont = new Font(input);
  let style = `@font-face{font-family:"${iconFont.fontName}";src:url(${incName}?_=${new Date().getTime()}) format("woff")}.${iconFont.fontName}{display:inline;vertical-align: middle}.${iconFont.fontName}:after{display:inline;width:1em;font-family:"${iconFont.fontName}";font-style:normal}`;
  let writed = 0;

  // 生成svg字体文件
  iconFont.on('toSvg', () => {

    // 转成woff
    iconFont.toWOFF();

    // 拼装css
    style += iconFont.fontVector.map((icon) => {
      return `.${iconFont.fontName}.icon-${icon.name}:after{content:"\\${icon.code}"}`;
    }).join(' ');

    // 写入woff文件
    iconFont
      .on('writed', (err) => {
        writed++;
        if ((err || 2 === writed) && callback) {

          writed += 2;

          let handle = setTimeout(() => {
            clearTimeout(handle);
            callback(err);
          }, 0);
        }
      })
      .writeWoff(outFontFile);

    // 写入css文件
    new Style(style)
      .compress()
      .on('writed', (err) => {
        writed++;
        if ((err || 2 === writed) && callback) {

          writed += 2;

          let handle = setTimeout(() => {
            clearTimeout(handle);
            callback(err);
          }, 0);
        }
      }).write(outCssFile);
  });
}

function writeRes(outFile, fileObj, callback) {
  outFile.name += `.${fileObj.hash().substr(0,6)}.min`;
  let outName = path.format(outFile);
  fileObj.write(outName);
  fileObj.on('writed', callback);
  return outName;
}

function main(args) {

  // 参数检查
  argCheck(args);

  // 初始化一个网站
  let site = new Site(args['domain'], args['default']);

  let count = {
    style: 0,
    script: 0
  };

  site.on('map', () => {

    //mkFont()
    // 遍历引用关系图    
    for (let [index, info] of site.mapper) {

      // 构建输出文件名对象
      info.outFile = path.parse(path.join(args['out'], index));
      delete info.outFile.base;

      // 跳过不存在的文件
      if (info.notFound) {
        return;
      }

      switch (info.type) {
        case '.less':
          count.style++;
          File.read(info.fileName, (fileObj) => {
            let styleFile = new Style(fileObj);
            styleFile.fileName = info.fileName;

            styleFile.on('less', () => {

              // 解析less完成
              styleFile.compress();
              info.outName = writeRes(info.outFile, styleFile, (err) => {
                if (err)
                  console.error(err.message);

                // 所有less均已完成写入
                if (0 === --count.style) {
                  console.log('css done');
                }
              });
            });

            styleFile.less();
          });
          break;
        case '.es6':
          count.script++;
          File.read(info.fileName, (fileObj) => {
            let scriptFile = new Script(fileObj).es6().compress();
            info.outName = writeRes(info.outFile, scriptFile, (err) => {
              if (err)
                console.error(err.message);

              // 所有js均已完成写入
              if (0 === --count.script) {
                console.log('js done');
              }
            });
          });
          break;
      }
    }
    //console.log(site.mapper);

  });

  site.map();
  return 0;
}

(function() {
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
})();