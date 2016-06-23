#!/usr/bin/env node

// [START server]

// [END server]
var express = require('express');
var app = express();

var Memcached = require('memcached');


var user = "USER";

app.set('view engine', 'pug');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var current = "NODATA";
// The environment variables are automatically set by App Engine when running
// on GAE. When running locally, you should have a local instance of the
// memcached daemon running.
var memcachedAddr = process.env.MEMCACHE_PORT_11211_TCP_ADDR || 'localhost';
var memcachedPort = process.env.MEMCACHE_PORT_11211_TCP_PORT || '11211';
var memcached = new Memcached(memcachedAddr + ':' + memcachedPort);

app.post('/tv', function(request, response, next){
    console.log('URL: ' + JSON.stringify(request.body));
    memcached.set(user, request.body, 60, function (err) {
      if (err) {
        return next(err);
      }
      response.send(request.body.url);
    });
});

app.get('/', function (req, res, next) {
    console.log('/');
    memcached.get(user, function (err, value) {
        if (err) {
            return next(err);
        }
        if (!value) {
            value = "#";
        }
        res.render('tv', {title : "NODATA"});
    });
});

app.get('/gettv', function (req, res, next) {
    console.log('/gettv');
    memcached.get(user, function (err, value) {
        if (err) {
            return next(err);
        }
        if (value) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(value));
        }
    });
});


var server = app.listen(process.env.PORT || '8080', function () {
    console.log('App listening on port %s', server.address().port);
    console.log('Press Ctrl+C to quit.');
});
