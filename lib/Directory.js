{
  'use strict';

  const fs = require('fs');
  const path = require('path');

  class _MkPath {
    constructor(dir) {
      this._stack = [];
      this._dir = dir;
    }

    _mkPath() {
      fs.mkdir(this._dir, (err) => {
        if (err) {
          if ('EEXIST' === err.code) {
            let dirObj = path.parse(this._dir);
            this._stack.push(dirObj.name);
            this._dir = dirObj.dir;
            return this._mkPath();
          }

          this.callback && this.callback(err);
        }
        if (this._stack.length) {
          this._dir = path.join(this._dir, this._stack.pop());
          this._mkPath();
        }

        this.callback && this.callback();
      });
      return this;
    }

    touchFile() {}
  };

  class _Walk {
    constructor(root) {
      this._count = 1;
      this._root = root;
      this._files = [];
    }

    _walk(dir = '.') {
      fs.readdir(path.join(this._root, dir), (err, files) => {
        if (err)
          throw err;

        files.forEach((item, index) => {

          let file = path.join(dir, item);
          let abs_file = path.join(this._root, file);

          let fileStat = fs.statSync(abs_file);

          if (fileStat.isFile()) {

            this._files.push(abs_file);
          } else if (fileStat.isDirectory()) {

            this._count++;
            let handle = setTimeout(() => {
              clearTimeout(handle);

              this._walk(file);
            }, 0);
          }

          if (index + 1 === files.length) {

            let handle = setTimeout(() => {
              clearTimeout(handle);

              if (0 >= --this._count) {

                this.resolve(null, this._files);
              }
            }, 0);
          }
        });
      });

      return this;
    }
  };

  module.exports = {
    mkPath: function(dir, callback) {
      let ret = new _MkPath(dir);
      ret.callback = callback;
      ret._mkPath();
    },

    walk: function(dir, callback) {
      try {
        let ret = new _Walk(dir);
        ret.resolve = callback;
        ret._walk();
      } catch (e) {
        callback(e, null);
      }
    }
  };
}