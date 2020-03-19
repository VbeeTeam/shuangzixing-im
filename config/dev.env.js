"use strict";
const merge = require("webpack-merge");
const prodEnv = require("./prod.env");

module.exports = merge(prodEnv, {
    NODE_ENV: '"development"',
    BASE_SOCKET: '"http://192.168.199.31:9090"',
    BASE_API: '"http://192.168.199.31:8000/"'
    // BASE_SOCKET: '"http://app.xingchixinxi.com:8300"',
    // BASE_API: '"http://app.xingchixinxi.com:8089/eladmin-system-2.3"'
    // BASE_SOCKET: '"http://app.shuangzixinggame.com:8300"',
    // BASE_API: '"http://app.shuangzixinggame.com:8089/eladmin-system-2.3"'
});
