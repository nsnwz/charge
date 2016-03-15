/**
 * Created by miller on 2016/1/16.
 */

'use strict';
var http = require("http");
var log = require('./log.js').helper;
var redisClient = require('./redisclient');
var post = require('./post');
var querystring = require('querystring');
var async = require('async');

var httpServer = http.createServer(function (req, res) {
    var dataChunks = undefined;
    req.on('data', function (chunk) {
        console.log("receive data");
        if(dataChunks === undefined)
            dataChunks = [];
        dataChunks.push(chunk);
    });

    req.on('end', function () {
        var body;
        if(dataChunks && dataChunks.length !== 0){
            body = Buffer.concat(dataChunks);
        }
        if(req.method === "OPTIONS"){
            res.writeHead(200, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "1728000", "Content-Type" :"text/plain; charset=UTF-8"});
            res.end();
        }else{
            res.setHeader("Access-Control-Allow-Origin", "*");
            try {
                var ret = querystring.parse(body.toString('utf-8'));
                log.writeDebug("charge " + ret.id + "|" + ret.money + "|" + ret.orderId + "|" + ret.serverId);
                async.waterfall([
                    function(cb) {
                        redisClient.getKey(ret.id + ret.orderId, function(err, redis) {
                            if (redis) {
                                return;
                            } else {
                                cb(null);
                            }
                        });
                    }, function(cb) {
                        redisClient.hincrby(ret.id + 'PLANT' + ret.serverId - 1, "money", ret.money, function(err, redis) {
                            if (!err) {
                                cb(null);
                            }
                        });
                    }, function(cb) {
                        redisClient.updateKey(ret.id + ret.orderId, 1, function(err, redis) {
                            if (!err) {
                                cb(null);
                            }
                        })
                    }, function(cb) {
                        redisClient.expire(ret.id + ret.orderId, 60 * 60, function(err, redis) {});
                    }
                ], function(err) {});
            } catch(err) {
                var errorMsg = 'Error ' + new Date().toISOString() + req.body + err.stack + err.message;
                log.writeErr(errorMsg);
            }
        }
    });
    req.on('error', function (err) {
        log.writeErr("request from client err ", err);
    });
});

httpServer.listen(8001);
log.writeInfo("server start");


process.on('uncaughtException', function (err) {
    log.writeErr(' Caught exception: ', err.stack);
    console.log(' Caught exception: ', err.stack);
});