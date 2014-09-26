// Dependencies *********
var express  = require('express');
var path     = require('path');
var logger   = require('morgan');
var mongoose = require('mongoose');
var request  = require('request');
var xml2js = require('xml2js');

// Middleware ***********
var app    = express();
var router = express.Router();
var xmlParser = xml2js.Parser({
		explicitArray: false,
		normalizeTags: true
	});
app.set('port', process.env.port || 3000);
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

/************************
	Defining all the routes
 ***********************/

// Search route
router.get('/api/search', function(req, res, next) {
	var search = req.query.searchString
					.toLowerCase()
					.replace(/ /g, '_')
					.replace(/[^\w-]+/g, '');

	request.get('http://thetvdb.com/api/GetSeries.php?seriesname=' + search, function(error, response, body) {
		if(error)
			return next(error);
		xmlParser.parseString(body, function(error, result) {
			if(!result.data.series)
				return res.send([]);
			if(result.data.series instanceof Array)
				res.send(result.data.series);
			else {
				res.send([result.data.series]);
			}
		});
	});
});

// Show Details route
router.get('/api/show/:id', function(req, res, next) {
	var apiKey = 'F917081C46B60FCD';
	var seriesID = req.params.id;

	request.get('http://thetvdb.com/api/' + apiKey + '/series/' + seriesID + '/all/en.xml', function(error, response, body) {
		if(error)
			next(error);
		xmlParser.parseString(body, function(error, result) {
			res.send(result.data);
		});
	});
});

// Default route
router.get('*', function(req, res) {
	res.redirect('/#' + req.originalUrl);
});

// Error route
router.use(function(err, req, res, next) {
	console.error(err.stack);
	res.send(500, { message: err.message });
});

// Telling express to use defined routes
app.use('/', router);

// Listening for someone
app.listen(app.get('port'), function() {
	console.log("Express server on port " + app.get('port'));
});