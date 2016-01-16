/**
 * Created by miller on 2016/1/16.
 */
/**
 * Created by miller on 2016/1/9.
 */

var querystring = require('querystring');
var url = require('url');
var http = require('http');
var https = require('https');
var util = require('util');

var post = function(urlstr, port, obj, callback) {
    var contentStr = JSON.stringify(obj);
    var contentLen = Buffer.byteLength(contentStr, 'utf8');
    var urlData = url.parse(urlstr);

    //HTTP请求选项
    var opt = {
        hostname: urlData.hostname,
        path: urlData.path,
        method: 'POST',
        port : port,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            'Content-Length': contentLen
        }
    };

//处理事件回调
    var req = http.request(opt, function(httpRes) {
        var buffers = [];
        httpRes.on('data', function(chunk) {
            buffers.push(chunk);
        });

        httpRes.on('end', function(chunk) {
            var wholeData = Buffer.concat(buffers);
            var dataStr = wholeData.toString('utf8');
            //console.log(JSON.parse(dataStr));
            console.log('content ' + wholeData);
            callback(dataStr);
        });
    }).on('error', function(err) {
        console.log('error ' + err);
    });

    console.log('write str ', contentStr, contentLen);
    req.write(contentStr);
    req.end();
};

module.exports = post;