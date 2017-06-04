{
  'use strict';
  const path = require('path');
  const fs = require('fs');
  const File = require('./File.js');

  // 规则
  const rgx = [{
    rule: /[\r\t\n]/g, // 换行符
    to: ''
  }, {
    rule: /\s+/g, // 连续空字符
    to: ' '
  }, {
    rule: /\<\!--[\s\S]*--\>/g, // 注释
    to: ''
  }, {
    rule: /\>  \</g, // 标签间空格
    to: '$1'
  }];

  class HTML extends File {
    constructor(content) {
      super(content);
      this.isA['HTML'] = true;

      this._style = new Set();
      this._script = new Set();
      this._image = new Set();
      this.resTable = new Map();
    }

    // 解析
    parse() {

      // style
      let styleList = this._content.match(/\<link\s+([\s\S^\>]*?)\s*\>/g) || [];
      styleList = styleList.map((item) => {
        let foo = item.match(/href\=\"(\S+\.(css|less))\"/);

        if (foo && Array.isArray(foo)) {
          return foo[1];
        }
        return null;
      });

      this._style = new Set(styleList);
      this._style.delete(undefined);
      this._style.delete(null);

      // script
      let scriptList = this._content.match(/\<script\s+([\s\S^\>]*?)\s*\>/g) || [];
      scriptList = scriptList.map((item) => {
        let foo = item.match(/src="(\S+)"/);

        if (foo && Array.isArray(foo)) {
          return item.match(/src="(\S+)"/)[1];
        }
        return null;
      });

      this._script = new Set(scriptList);
      this._script.delete(undefined);
      this._script.delete(null);

      // image
      let imageList = this._content.match(/\<img\s+([\s\S^\>]*?)\s*\>/g) || [];
      imageList = imageList.map((item) => {
        let foo = item.match(/src="(\S+)"/);

        if (foo && Array.isArray(foo)) {
          return item.match(/src="(\S+)"/)[1];
        }
        return null;
      });

      this._image = new Set(imageList);
      this._image.delete(undefined);
      this._image.delete(null);

      return {
        style: [...this._style],
        script: [...this._script],
        image: [...this._image]
      };
    }

    // 压缩
    compress() {
      rgx.forEach((item) => {
        this._out = this._out.replace(item.rule, item.to);
      });

      return this;
    }

    // resTable Map
    // 替换资源名
    replace() {
      for (item of this.resTable) {
        this._out = this._out.replace(item[0], item[1]);
      }

      return this;
    }
  };

  module.exports = HTML;
}