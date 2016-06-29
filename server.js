#!/usr/bin/env node

// [START server]

// [END server]
var express = require('express');
var qr = require('qr-image');
var app = express();

var Memcached = require('memcached');

app.set('view engine', 'pug');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')

app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var TIMEOUT = 60*60*24*60;
var current = "NODATA";
// The environment variables are automatically set by App Engine when running
// on GAE. When running locally, you should have a local instance of the
// memcached daemon running.


var memcachedAddr = process.env.MEMCACHE_PORT_11211_TCP_ADDR || 'localhost';
var memcachedPort = process.env.MEMCACHE_PORT_11211_TCP_PORT || '11211';
var memcached = new Memcached(memcachedAddr + ':' + memcachedPort);

app.post('/tv', function(request, response, next){
    console.log('URL: ' + JSON.stringify(request.body));
    var remoteid = "remote-" + request.cookies.device;
    console.log("SET " + remoteid);
    memcached.set(remoteid, request.body, TIMEOUT, function (err) {
      if (err) {
        return next(err);
      }
      response.send(request.body.url);
    });
});

app.get('/', function (req, res, next) {
    if (req.cookies.tvid) {
        console.log("TV");
        res.render('tv', {title : "NODATA"});
    } else {
        console.log("REDIRECT");
        res.redirect('/link');
    }
});

app.get('/link', function (req, res, next) {
    // TODO: get persistant id and tmp code
    var id = Math.floor((Math.random() * 1000) + 1).toString();
    if (req.cookies.tvid) {
        id = req.cookies.tvid;
    } else {
        res.cookie("tvid", id);
    }
    memcached.del("tv-" + id, function (err) {
    });
    console.log(id);
    var url = id;
    var code = qr.imageSync(url, { type: 'png' });
    res.render('link', {data : "data:image/png;base64, " + code.toString('base64'), id: url});
});

app.post('/register', function (req, res, next) {
    console.log("/register" + req.cookies);
    if (req.cookies.device) {
        req.query.tv;
        var key = "tv-" + req.query.tv;
        // BIND req.query.tv  --> req.cookies.device
        console.log(key + "=" + req.cookies.device);
        memcached.set(key, req.cookies.device, TIMEOUT, function (err) {
            if (err) {
                return next(err);
            }
        });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({}));
});


app.get('/gettv', function (req, res, next) {
    var send = function(res, data) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data));
    };

    console.log(req.cookies);
    if (req.cookies.tvid) {
        var key = "tv-" + req.cookies.tvid;
        console.log(key);
        memcached.get(key, function (err, value) {
            if (err) {
                console.log("ERROR #1");
                return next(err);
            }
            console.log(key +  " -> " + value);
            if (value) {
                var remoteid = "remote-" + value;
                memcached.get(remoteid, function (err, data) {
                    if (err) {
                        console.log("ERROR #2");
                        return next(err);
                    }
                    console.log(data);
                    if (data) {
                        send(res, data);
                        if (data.force == "1") {
                            data.force = "0";
                            memcached.set(remoteid, data, TIMEOUT, function (err) {
                            });
                        }
                    } else {
                        send(res, {});
                    }
                });
            } else {
                send(res, {});
            }
        });
    } else {
        send(res, {});
    }
});


var server = app.listen(process.env.PORT || '8080', function () {
    console.log('App listening on port %s', server.address().port);
    console.log('Press Ctrl+C to quit.');
});
