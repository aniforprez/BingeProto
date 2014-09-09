var express = require('express');
var path = require('path');
var logger = require('morgan');
var mongoose = require('mongoose');

var app = express();

app.set('port', process.env.port || 3000);
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(app.get('port'), function() {
	console.log("Express server on port " + app.get('port'));
});