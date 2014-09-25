var express = require('express');
var path = require('path');
var logger = require('morgan');
var mongoose = require('mongoose');

var app = express();
var router = express.Router();

app.set('port', process.env.port || 3000);
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(app.get('port'), function() {
	console.log("Express server on port " + app.get('port'));
});

app.get('/api/show', function(req, res, next) {
	res.send([{ result: req.query.searchString }]);
});

app.get('/api/show/:id', function(req, res, next) {
	res.send({ message: "Here's data for show " + req.params.id });
});

app.get('*', function(req, res) {
	res.redirect('/#' + req.originalUrl);
});

app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.send(500, { message: err.message });
});