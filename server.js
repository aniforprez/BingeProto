var express  = require('express');
var path     = require('path');
var logger   = require('morgan');
var mongoose = require('mongoose');
var request  = require('request');
var xml2js = require('xml2js');

var app    = express();
var router = express.Router();

app.set('port', process.env.port || 3000);
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

router.use(function(err, req, res, next) {
	console.error(err.stack);
	res.send(500, { message: err.message });
});

router.get('/api/show', function(req, res, next) {
	var search = req.query.searchString
					.toLowerCase()
					.replace(/ /g, '_')
					.replace(/[^\w-]+/g, '');
	var xmlParser = xml2js.Parser({
		explicitArray: false,
		normalizeTags: true
	});

	request.get('http://thetvdb.com/api/GetSeries.php?seriesname=' + search, function(error, response, body) {
		if(error)
			return next(error);
		xmlParser.parseString(body, function(error, result) {
			if(!result.data.series) {
				return res.send({ message: "No search results" });
			}
			res.send(result.data.series);
		});
	});
	// res.send([{ result: req.query.searchString }]);
});

router.get('/api/show/:id', function(req, res, next) {
	res.send({ message: "Here's data for show " + req.params.id });
});

router.get('*', function(req, res) {
	res.redirect('/#' + req.originalUrl);
});

app.use('/', router);

app.listen(app.get('port'), function() {
	console.log("Express server on port " + app.get('port'));
});