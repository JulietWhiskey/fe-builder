{
  'use strict';
  const path = require('path');
  const File = require(path.join(__dirname, 'File'));
  const less = require('less');

  // 规则
  const rgx = [{
    rule: /\/\/.*[\r\n]/g, // 行注释
    to: ''
  }, {
    rule: /[\r\t\n]/g, // 换行符
    to: ''
  }, {
    rule: /\s+/g, // 连续空字符
    to: ' '
  }, {
    rule: / *(:|;|,|\{|\}) */g, // 冒号前后空格
    to: '$1'
  }, {
    rule: /;}/g, // 最后一个分号
    to: '}'
  }, {
    rule: /\'/g, // 同一换成单引号
    to: '\"'
  }, {
    rule: /\'/g, // 去掉引号
    to: ''
  }, {
    rule: /0\./g, // 小数
    to: '.'
  }];

  class Style extends File {

    constructor(content) {
      super(content);
      this.isA['Style'] = true;
    }

    less() {
      less.render(this._out, (e, css) => {
        this._out = css['css'];
        this.emit('less');
      });

      return this;
    }

    compress() {
      rgx.forEach((item) => {
        this._out = this._out.replace(item.rule, item.to);
      });
      return this;
    }
  };

  module.exports = Style;
};