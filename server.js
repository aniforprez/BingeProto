//////////////////
// Dependencies //
//////////////////
var express  = require('express');
var path     = require('path');
var logger   = require('morgan');
var mongoose = require('mongoose');
var request  = require('request');
var xml2js   = require('xml2js');
var mongoose = require('mongoose');
var _        = require('lodash');
var async    = require('async');

var util = require('util');
// Use the bottom log to log and entire object
// console.log(util.inspect(myObject, false, null));


////////////////
// Middleware //
////////////////
var app       = express();
var router    = express.Router();
var xmlParser = xml2js.Parser({
		explicitArray: false,
		normalizeTags: true
	});
app.set('port', process.env.port || 3000);
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

/////////////////////
// Database models //
/////////////////////
var showSchema = new mongoose.Schema({
	_id           : Number,
	name          : String,
	airsDayOfWeek : String,
	airsTime      : String,
	contentRating : String,
	firstAired    : String,
	genre         : [String],
	imdb_id       : String,
	language      : String,
	network       : String,
	overview      : String,
	runtime       : String,
	status        : String,
	banner        : String,
	poster        : String,
	actors: [{
		name     : String,
		role     : String,
		sortOrder: Number,
		image    : String
	}],
	seasons: [{
		seasonNumber: Number,
		seasonID    : Number,
		episodes: [{
			episodeID    : Number,
			episodeNumber: Number,
			name         : String,
			director     : [String],
			firstAired   : String,
			guestStars   : [String],
			imdb_id      : String,
			overview     : String
		}]
	}]
});

var Show = mongoose.model('Show', showSchema);

mongoose.connect('localhost');

////////////////////////////
//Defining all the routes //
////////////////////////////

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

	var endShowQuery = function(error, show) {
		if(error)
			return next(error);
		res.send(show);
	};

	async.waterfall([
		function(callback) {
			Show.findById(seriesID, function(err, show) {
				if(err)
					return next(err);
				if(show)
					endShowQuery(null, show);
				if(!show)
					callback(null, "Show not in DB");
			});
		},
		function(message, callback) {
			console.log(message);
			request.get('http://thetvdb.com/api/' + apiKey + '/series/' + seriesID + '/all/en.xml', function(error, response, body) {
				if(error)
					next(error);
				xmlParser.parseString(body, function(err, result) {
					callback(err, result.data);
				});
			});
		},
		function(data, callback) {
			var series = data.series;
			var episodes = data.episode;

			var show = new Show({
				_id          : series.id,
				name         : series.seriesname,
				airsDayOfWeek: series.airs_dayofweek,
				airsTime     : series.airs_time,
				contentRating: series.contentrating,
				firstAired   : series.firstaired,
				genre        : series.genre.split('|').filter(Boolean),
				imdb_id      : series.imdb_id,
				language     : series.language,
				network      : series.network,
				overview     : series.overview,
				runtime      : series.runtime,
				status       : series.status,
				banner       : series.banner,
				poster       : series.poster,
				actors       : [],
				seasons      : []
			});
			_.each(episodes, function(episode) {
				var episodeObj = {
					episodeID    : episode.id,
					episodeNumber: episode.episodenumber,
					name         : episode.episodename,
					director     : episode.director.split('|').filter(Boolean),
					firstAired   : episode.firstaired,
					guestStars   : episode.gueststars.split('|').filter(Boolean),
					imdb_id      : episode.imdb_id,
					overview     : episode.overview
				};

				var seasonIndex = _.findIndex(show.seasons, function(season) {
					return season.seasonNumber == episode.seasonnumber;
				});
				if(seasonIndex > -1) {
					show.seasons[seasonIndex].episodes.push(episodeObj);
				}
				else {
					show.seasons.push({
						seasonNumber: episode.seasonnumber,
						seasonID    : episode.seasonid,
						episodes    : [episodeObj]
					});
				}
			});

			callback(null, show);
		},
		function(show, callback) {
			request.get('http://thetvdb.com/api/' + apiKey + '/series/' + seriesID + '/actors.xml', function(error, response, body) {
				if(error)
					next(error);
				xmlParser.parseString(body, function(err, result) {
					_.each(result.actors.actor, function(actor) {
						show.actors.push({
							name     : actor.name,
							role     : actor.role,
							image    : actor.image,
							sortOrder: actor.sortorder
						});
					});

					callback(err, show);
				});
			});
		},
		function(show, callback) {
			show.save(function(err) {
				if(err)
					return next(err);
				callback(null, "Saved successfully");
			});
		},
		function(message, callback) {
			console.log(message);
			Show.findById(seriesID, function(err, showData) {
				if(err)
					return next(err);
				callback(null, showData);
			});
		}
	], endShowQuery);
});

// Default route
router.get('*', function(req, res) {
	res.redirect('/#' + req.originalUrl);
});

// Error route
router.use(function(err, req, res, next) {
	console.error(err.stack);
	res.status(500).send({ message: err.message });
});

// Telling express to use defined routes
app.use('/', router);

///////////////////////////
// Listening for someone //
///////////////////////////
app.listen(app.get('port'), function() {
	console.log("Express server on port " + app.get('port'));
});