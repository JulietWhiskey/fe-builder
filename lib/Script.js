{
  'use strict';
  const path = require('path');
  const File = require(path.join(__dirname, 'File'));
  const babel = require('babel-core');
  const UglifyJS = require('uglify-js');
  let reactTools = null;

  class Script extends File {
    constructor(content) {
      super(content);
      this.isA['Script'] = true;
    }

    jsx() {
      if (!reactTools) {
        reactTools = require('react-tools');
      }
      this._out = reactTools.transform(this._out, {});
      return this;
    }

    es6() {
      this._out = babel.transform(this._out, {
        presets: ['es2015']
      }).code;
      return this;
    }

    compress() {
      let ret = UglifyJS.minify(this._out);
      this._out = ret.code;
      return this;
    }
  };

  module.exports = Script;
}