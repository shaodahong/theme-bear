var a1 = 100;
const a2 = '你好,斗鸡好哦';
let a3 = [100, 200, '你哈皮', null, undefined];
var a4 = {
  json1: 123,
  json2: '你哈皮哈珀卡帕',
  json3: {
    a1: 123,
    a2: '你好'
  },
  json4: function () {
    return 123;
  }
}

var func1 = function () {
  this.a = 100;
  this.b = '你好'
}

a4.json4()

function func2(para1, para2) {
  document.getElementById('dd')
  return para1 + para2;
}

require('angular')
import angular from 'angular'
import {
  http
} from 'axios'

export default a1;
module.exports = a2;

/^[a-z|0-9]\\#$/.test(a1)

var a5 = new func2();

var time1 = +new Date()

Array.isArray.call(null, a3);

delete a3[0];

let s = Symbol();

var it = makeIterator(['a', 'b']);

it.next() // { value: "a", done: false }
it.next() // { value: "b", done: false }
it.next() // { value: undefined, done: true }

function makeIterator(array) {
  var nextIndex = 0;
  return {
    next: function () {
      return nextIndex < array.length ? {
        value: array[nextIndex++],
        done: false
      } : {
        value: undefined,
        done: true
      };
    }
  };
}

var gen = function* () {
  var f1 = yield readFile('/etc/fstab');
  var f2 = yield readFile('/etc/shells');
  console.log(f1.toString());
  console.log(f2.toString());
};

//定义类
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  toString() {
    return '(' + this.x + ', ' + this.y + ')';
  }
}

import {
  stat,
  exists,
  readFile
} from 'fs';

var buffer = new ArrayBuffer(12);

var x1 = new Int32Array(buffer);
x1[0] = 1;
var x2 = new Uint8Array(buffer);
x2[0] = 2;

x1[0] // 2