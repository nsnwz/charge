/**
 * Created by miller on 2016/1/16.
 */

'use strict';
var http = require("http");
var log = require('./log.js').helper;
var redisClient = require('./redisClient');
var post = require('./post');

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
                var ret = JSON.parse(body.toString('utf-8'));
                redisClient.hincrby(ret.id + 'PLANT', "money", ret.money, function(err, redis) {
                    if (!err) {
                        var obj = {cmdID : '1030', uid : ret.id};
                        log.writeDebug(uid + 'charge ' + ret.money);
                        post('http://127.0.0.1', 8000, obj, function(data) {
                            var data = JSON.parse(data);
                        });
                    } else {

                    }
                });
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