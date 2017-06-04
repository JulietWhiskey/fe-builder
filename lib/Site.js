{
  const fs = require('fs');
  const path = require('path');
  const EventEmitter = require('events');
  const Directory = require('./Directory.js');
  const File = require('./File.js');
  const HTML = require('./HTML.js');

  class Site extends EventEmitter {
    constructor(domain, root) {
      super();
      this.root = root;
      this.mapper = new Map();
      this.online = new RegExp(`(http:\/\/|https:\/\/|\/\/)${domain.replace(/\./g, '\\.')}(\/.+)`);
    }

    pathToIndex(file, type) {
      let index = file.replace(this.root, '');
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

    onlineToIndex(file) {
      let ret = file.match(this.online);
      return ret ? ret[2] : file;
    }

    map() {
      Directory.walk(this.root, (err, list) => {
        if (err) {
          throw err;
        }

        // 遍历所有文件
        for (let file of list) {

          let ff = path.parse(file);
          let fileInfo = {
            fileName: file,
            path: ff.dir,
            name: ff.name,
            type: ff.ext,
            link: []
          };

          // 网站地图，索引为绝对路径，转换后非压缩扩展名
          let index = this.pathToIndex(file, fileInfo.type);
          this.mapper.set(index, fileInfo);
        }

        for (let [index, fileInfo] of this.mapper) {

          // 解析html文件中的引用
          if ('.html' === fileInfo.type) {
            let fileObj = File.readSync(fileInfo.fileName);
            let html = new HTML(fileObj);
            let res = html.parse();

            // 遍历html引用的资源
            Object.keys(res).forEach((type) => {
              fileInfo.link = [...fileInfo.link, ...res[type]];
            });

            // 去掉域名
            fileInfo.link = fileInfo.link.map((item) => {
              return this.onlineToIndex(item);
            });

            // 资源文件到html文件的map
            fileInfo.link.forEach((resFile) => {
              let resInfo = this.mapper.get(resFile);
              if (!resInfo) {
                return console.error(`res file index ${resFile}\a not found`);
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