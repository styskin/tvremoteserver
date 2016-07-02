#!/usr/bin/env node

// [START server]

// [END server]
var express = require('express');
var qr = require('qr-image');
var app = express();
app.use(express.static('public'));

var kvstore = require('gcloud-kvstore');
var gcloud = require('gcloud')({
    //projectId: process.env.GCLOUD_PROJECT,
    projectId: 'tvremote-1334',
    keyFilename: 'tvremote-91ec7f597a81.json'
});

var datastore = gcloud.datastore();
var store = kvstore(datastore);

app.set('view engine', 'pug');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')

app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var current = "NODATA";
// The environment variables are automatically set by App Engine when running
// on GAE. When running locally, you should have a local instance of the
// memcached daemon running.

app.post('/tv', function(request, response, next){
    console.log('URL: ' + JSON.stringify(request.body));
    var remoteid = "remote-" + request.cookies.device;
    console.log("SET " + remoteid);

    store.set(remoteid, request.body, function (err) {
        if (err) {
            return next(err);
        }
        response.send(request.body.url);
    });
});

app.get('/', function (req, res, next) {
    if (req.cookies.tvid) {
        console.log("TV");
        res.redirect('/main.html');
    } else {
        console.log("REDIRECT");
        res.redirect('/link');
    }
});

app.get('/link', function (req, res, next) {
    // TODO: get persistant id and tmp code
    var id = Date.now().toString() + Math.floor((Math.random() * 1000) + 1).toString();
    if (req.cookies.tvid) {
        id = req.cookies.tvid;
    } else {
        res.cookie("tvid", id);
    }
    store.delete("tv-" + id, function (err) {});
    console.log(id);
    var url = id;
    var code = qr.imageSync(url, { type: 'png' });
    res.render('link', {data : "data:image/png;base64, " + code.toString('base64'), tvid: url});
});

app.post('/register', function (req, res, next) {
    console.log("/register" + req.cookies);
    if (req.cookies.device) {
        req.query.tv;
        var key = "tv-" + req.query.tv;
        // BIND req.query.tv  --> req.cookies.device
        console.log(key + "=" + req.cookies.device);
        store.set(key, req.cookies.device, function (err) {
            if (err) {
                return next(err);
            }
        });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({done:"ok"}));
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
        store.get(key, function (err, value) {
            if (err) {
                console.log("ERROR #1");
                return next(err);
            }
            console.log(key +  " -> " + value);
            if (value) {
                var remoteid = "remote-" + value;
                store.get(remoteid, function (err, data) {
                    if (err) {
                        console.log("ERROR #2");
                        return next(err);
                    }
                    console.log(data);
                    if (data) {
                        send(res, data);
                        if (data.force == "1") {
                            data.force = "0";
                            store.set(remoteid, data, function (err) {});
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
