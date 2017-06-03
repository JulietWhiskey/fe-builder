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

    map() {
      Directory.walk(this.root, (err, list) => {
        if (err) {
          throw err;
        }

        // 遍历所有文件
        for (let file of list) {

          let fileInfo = {
            fileName: file,
            type: path.extname(file),
            link: []
          };

          // 网站地图，索引为绝对路径，转换后非压缩扩展名
          let index = file.replace(this.root, '');
          switch (fileInfo.type) {
            case '.less':
              index = index.replace('less', 'css');
              break;
            case '.es6':
              index = index.replace('es6', 'js');
              break;
          };
          this.mapper.set(index, fileInfo);

          // 解析html文件中的引用
          if ('.html' === fileInfo.type) {
            let fileObj = File.readSync(file);
            let html = new HTML(fileObj);
            let res = html.parse();

            // 遍历html引用的资源
            Object.keys(res).forEach((type) => {
              fileInfo.link = [...fileInfo.link, ...res[type]];
            });
          }

          // 去掉域名
          fileInfo.link = fileInfo.link.map((item) => {
            let arr = item.match(this.online);
            return arr ? arr[2] : item;
          });
        }

        this.emit('map');
      });
    }

  };

  module.exports = Site;
}