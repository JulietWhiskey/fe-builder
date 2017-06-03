{
  'use strict';

  const s2s = require('svgicons2svgfont');
  const s2t = require('svg2ttf');
  const t2w = require('ttf2woff');
  const path = require('path');
  const fs = require('fs');
  const EventEmitter = require('events');

  class Font extends EventEmitter {
    constructor(input) {
      super();

      this.fontName = 'icon-font';
      this.fontId = '';
      this.fontStyle = 'normal';
      this.fontWeight = 400;
      this.fixedWidth = false;
      this.centerHorizontally = false; // Calculate the bounds of a glyph and center it horizontally. Warning: The bounds calculation is currently a naive implementation that may not work for some icons. We need to create a svg-pathdata-draw module on top of svg-pathdata to get the real bounds of the icon. It's on the bottom of my to do, but feel free to work on it. Discuss it in the related issue.
      this.normalize = false; // Normalize icons by scaling them to the height of the highest icon.
      this.fontHeight = NaN; // The outputted font height (defaults to the height of the highest input icon).
      this.round = 10e12; // Setup SVG path rounding.
      this.descent = 0; // The font descent. It is usefull to fix the font baseline yourself. Warning: The descent is a positive value!
      this.ascent = NaN; // fontHeight - descent    The font ascent. A suitable value for this is computed for you.
      this.metadata = null; // The font metadata. You can set any character data in but it is the be suited place for a copyright mention.
      this.log = console.log; // Allows you to provide your own logging function. Set to function(){} to impeach logging.
      this.contentCode = 0xEA00;
      this.input = input;

      // 判定目录还是文件列表
      if ('string' === typeof input) {

        // 遍历图标文件
        this.input = fs.readdirSync(input).map((file) => {

          // 源文件的绝对路径
          return path.join(input, file);
        });

      } else if (!Array.isArray(input)) {
        throw new TypeError('conf.input should be a string or a array');
      }
    }

    // 转换svg图片为svg字体
    toSvg() {
      this.fontStream = s2s({
        fontName: this.fontName,
        fontId: this.fontId,
        fontStyle: this.fontStyle,
        fontWeight: this.fontWeight,
        fixedWidth: this.fixedWidth,
        centerHorizontally: this.centerHorizontally,
        normalize: this.normalize,
        fontHeight: this.fontHeight,
        round: this.round,
        descent: this.descent,
        ascent: this.ascent,
        metadata: this.metadata,
        log: this.log
      });

      this.fontVector = [];
      this.input.forEach((file, index) => {

        let fileStat = fs.statSync(file);
        // 过滤文件
        if (fileStat.isFile() && ('.svg' === path.extname(file))) {

          let basename = path.basename(file, '.svg');

          // 源文件流
          let glyph = fs.createReadStream(file);
          let num = this.contentCode + index++;
          let unicode = String.fromCharCode(num);

          glyph.metadata = {
            unicode: [unicode],
            name: basename
          };

          this.fontVector.push({
            name: basename,
            code: num.toString(16)
          });

          this.fontStream.write(glyph);
        }
      });

      // Do not forget to end the stream
      this.fontStream.end();


      // Setting the font destination
      this.fontStream
        .on('finish', () => {
          this.svgFile = this.fontStream.read().toString();
          this.emit('toSvg');
        })
        .on('error', (err) => {
          this.fontStream = null;
          throw err;
        });

      return this;
    }

    // 转换成ttf格式
    toTTF() {
      if (!this.svgFile) {
        throw new Error('turnSvg not compiled');
      }
      let ttf = s2t(this.svgFile, {});
      this.ttfFile = new Buffer(ttf.buffer);

      return this;
    }

    toWOFF() {
      if (!this.ttfFile) {
        this.toTTF();
      }

      // 转换成woff格式
      let woff = t2w(new Uint8Array(this.ttfFile));
      this.woffFile = new Buffer(woff.buffer);

      return this;
    }

    writeWoff(outFile) {
      fs.writeFile(outFile, this.woffFile, (err) => {
        this.emit('writed', err);
      });

      return this;
    }

  };

  module.exports = Font;
}