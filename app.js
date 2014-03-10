
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , path = require('path')
  , uuid = require('uuid')
  , _ = require('underscore')
  , twitter = require('ntwitter')
  , tags = ["obama", "putin", "ukraine"]
  , n = 0;

GLOBAL.connections = {};

var twit = new twitter({
  consumer_key: 'oHnyGpc65JKXv3ZQ7PNesQ',
  consumer_secret: 'UdEKjKWi7ktpJvdRT9tHJ1qqGYifd8Ssk09L9Oc4Om8',
  access_token_key: '426838000-KsuW4PXOXqlMNWMHMY5rKLZssDywn1jxNakffyYq',
  access_token_secret: 'F89gbk2iakws9vJNbts0IYuj6woVZDYwSVxsZnO0b6Ucd'
});

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
  n = (n+1) % 5;
  res.render("classifier", { tags: tags, MODEL_N: n});
});

app.get('/raw', function(req, res) {
  res.render('raw', { title: "Twitter Feed", keywords: tags.join(", ") });
});

app.get('/fun', function(req, res) {
  res.render("fun");
});

app.get('/classifier', function(req, res) {
  n = (n+1) % 5;
  res.render("classifier", { tags: tags, MODEL_N: n});
});

app.get('/tweets', function(req, res) {
  // keep the connection open indefinitely
  req.socket.setTimeout(Infinity);

  // create a way for us to push data to the client
  var conn = {
    id: uuid.v4(),
    send: function(data) {
      var body  = 'data: ' + JSON.stringify(data) + '\n\n';
      res.write(body);
    }
  };
  connections[conn.id] = conn;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable buffering for nginx
  });
  res.write('\n');

  req.on('close', function() {
    delete connections[conn.id];
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


twit.stream('statuses/filter', { track: tags }, function(stream) {
  stream.on('data', function(tweet) {
    _.each(connections, function(conn) {
      conn.send(tweet);
    });
  });
});


