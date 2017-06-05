;
(function() {
  const process = require('process');
  const fs = require('fs');
  const path = require('path');

  const File = require(path.join(__dirname, './File.js'));
  const Font = require(path.join(__dirname, './Font.js'));
  const Script = require(path.join(__dirname, './Site.js'));



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