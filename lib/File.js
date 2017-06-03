{
  const fs = require('fs');
  const crypto = require('crypto');
  const EventEmitter = require('events');

  class File extends EventEmitter {
    constructor(content) {
      super();
      this.isA = {
        file: true
      };
      this.copyConstructor(content);
    }

    copyConstructor(file) {
      if ('string' === typeof file) {
        this._content = file;
        this._out = file;
      } else if ('object' === typeof file && file.isA['file']) {
        this._content = file._content;
        this._out = file._out;
      }
      return this;
    }

    static read(filename, callback) {
      fs.readFile(filename, {
        encoding: 'utf8'
      }, (err, data) => {
        if (err)
          throw err;
        callback(new File(data));
      });
    }

    static readSync(filename) {
      let content = fs.readFileSync(filename, {
        encoding: 'utf8'
      });
      return new File(content);
    }

    hash(type = 'md5') {
      let hash = crypto.createHash(type);
      hash.update(this._out);
      return hash.digest('hex');
    }

    write(filename) {
      if (!filename) {
        filename = this.filename;
      }

      fs.writeFile(filename, this._out, (err) => {
        this.emit('writed', err);
      });
      return this;
    }
  };

  module.exports = File;
}