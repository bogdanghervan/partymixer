var express = require('express');
var app = express();
var port = 3000;

app.get('/', function (request, response) {
  response.send('Hello from Express!');
});

app.listen(port, function (err) {
  if (err) {
    return console.log('something bad happened', err);
  }
});
