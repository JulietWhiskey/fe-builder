{
  const fs = require('fs');
  const path = require('path');
  const EventEmitter = require('events');
  const Directory = require('./Directory.js');
  const File = require('./File.js');
  const HTML = require('./HTML.js');

  class FileInfo {

    constructor(srcRoot, outRoot, srcFileName) {
      let ff = path.parse(srcFileName);

      this.srcFileName = srcFileName;
      this.path = ff.dir;
      this.name = ff.name;
      this.type = ff.ext;
      this.link = [];
      this.outFileName = {};
      this.outFileIndex = {};


      // 网站地图，索引为绝对路径，转换后非压缩扩展名
      this.index = this.pathToIndex(srcRoot, srcFileName, ff.ext);
      this.outFileIndex = path.parse(this.index);
      delete this.outFileIndex.base;

      // 构建输出文件名对象
      this.outFileName = path.parse(path.join(outRoot, this.index));
      delete this.outFileName.base;
    }

    pathToIndex(srcRoot, file, type) {
      let index = file.replace(srcRoot, '');
      switch (type) {
        case '.less':
          index = index.replace('less', 'css');
          break;
        case '.es6':
          index = index.replace('es6', 'js');
          break;
      };
      return index;
    }

    writeRes(fileObj, opt) {
      return new Promise((resolve, reject) => {

        if (!opt) {
          opt = {
            hash: true,
            min: true
          };
        }

        if (opt.hash) {
          this.outFileName.name += '.' + fileObj.hash().substr(0, 6);
        }
        if (opt.min) {
          this.outFileName.name += `.min`;
        }

        this.outFileIndex.name = this.outFileName.name;

        let outName = path.format(this.outFileName);
        fileObj.write(outName);
        fileObj.on('writed', (err) => {
          err ? reject(err) : resolve();
        });
        this.outFileIndex = path.format(this.outFileIndex);

      });
    }
  };

  class Site extends EventEmitter {

    constructor(outRoot, domain, srcRoot) {
      super();
      this.outRoot = outRoot;
      this.srcRoot = srcRoot;
      this.mapper = new Map();
      this.online = new RegExp(`(http:\/\/|https:\/\/|\/\/)${domain.replace(/\./g, '\\.')}(\/.+)`);
    }

    onlineToIndex(file) {
      let ret = file.match(this.online);
      return ret ? ret[2] : file;
    }

    mapAFile(file) {
      let fileInfo = new FileInfo(this.srcRoot, this.outRoot, file);
      this.mapper.set(fileInfo.index, fileInfo);
      return fileInfo;
    }

    // 建立引用关系图
    map() {
      Directory.walk(this.srcRoot, (err, list) => {
        if (err) {
          throw err;
        }

        // map所有文件
        for (let file of list) {
          this.mapAFile(file);
        }

        for (let [index, fileInfo] of this.mapper) {

          // 解析html文件中的引用
          if ('.html' === fileInfo.type) {
            let fileObj = File.readSync(fileInfo.srcFileName);
            let html = new HTML(fileObj);
            let res = html.parse();

            // 遍历html引用的资源
            Object.keys(res).forEach((type) => {
              fileInfo.link = [...fileInfo.link, ...res[type]];
            });

            // 如果是html文件，则挂载
            if (fileInfo.link.length) {
              fileInfo.html = fileObj;
            }

            // 去掉域名
            fileInfo.link = fileInfo.link.map((item) => {
              return this.onlineToIndex(item);
            });

            // 资源文件到html文件的map
            fileInfo.link.forEach((resFile) => {
              let resInfo = this.mapper.get(resFile);

              // 引用的资源未发现
              if (!resInfo) {
                resInfo = this.mapAFile(resFile);
                resInfo.notFound = true;
                console.warn(`WARNING: res file index ${resFile} not found`);
              }
              resInfo.link.push(index);
            });
          }

        }

        this.emit('map');
      });
    }

  };

  module.exports = Site;
}