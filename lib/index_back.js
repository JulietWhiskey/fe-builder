;
(function() {
  const process = require('process');
  const fs = require('fs');
  const path = require('path');

  const File = require(path.join(__dirname, './File.js'));
  const Font = require(path.join(__dirname, './Font.js'));
  const Script = require(path.join(__dirname, './Site.js'));

  // 编译字体文件
  const mkFont = function(input, incName, outFontFile, outCssFile, callback) {
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
  };


  const main = function(argv) {
    let arg = argument(argv);

    if (!arg.watch) {
      showHelp();
      process.exit(0);
    }

    fs.watch(arg.watch, {
      persistent: true,
      recursive: true, // 只支持osx 和 windows
      encoding: 'utf8'
    }, function(eventType, filename) {

      // 解析文件名
      filename = path.join(arg.watch, filename);
      let fileName = path.parse(filename);

      if (!extDict[fileName.ext]) {
        return;
      }

      File.read(filename, function(file) {

        // 判断扩展名
        switch (fileName.ext) {
          case '.less':
            file = new Style(file);
            file
              .on('less', () => {
                file.compress();
                writeBack(fileName, file, '.css');
              })
              .less();
            break;
          case '.es6':
            file = new Script(file);
            file = file.es6().compress();
            writeBack(fileName, file, '.js');
            break;
          case '.png':
          default:
            break;
        }
      });

    });
  };

  main(process.argv);
})();