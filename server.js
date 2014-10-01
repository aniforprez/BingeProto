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
var agenda   = require('agenda')({ db: { address: 'localhost:27017/schedules' }});

var util = require('util');
// Use the bottom log to log and entire object
// console.log(util.inspect(myObject, false, null));


////////////////
// Middleware //
////////////////
var app       = express();
var router    = express.Router();
var xmlParser = xml2js.Parser({
		// this option only makes the xmlparser return an array if there are multiple objects returned. otherwise ALL tags become arrays which is dumb
		explicitArray: false,
		// all xml tags are turned to lowercase object properties
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
	noOfSeasons   : Number,
	noOfEpisodes  : Number,
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
// This function gets TheTVDB data for seriesID and saves it into Mongo. YOu can also supply a callback
showSchema.methods.fetchShowData = function(seriesID, rootCallback) {
	var apiKey = 'F917081C46B60FCD';
	var show   = this;

	async.waterfall([
		function(callback) {
			console.log("Getting showdata for id " + seriesID);
			request.get('http://thetvdb.com/api/' + apiKey + '/series/' + seriesID + '/all/en.xml', function(error, response, body) {
				if(error)
					return console.error(error);
				xmlParser.parseString(body, function(err, result) {
					callback(err, result.data);
				});
			});
		},
		function(data, callback) {
			var series = data.series;
			var episodes = data.episode;

			show._id          = series.id;
			show.name         = series.seriesname;
			show.airsDayOfWeek= series.airs_dayofweek;
			show.airsTime     = series.airs_time;
			show.contentRating= series.contentrating;
			show.firstAired   = series.firstaired;
			show.genre        = series.genre.split('|').filter(Boolean);
			show.imdb_id      = series.imdb_id;
			show.language     = series.language;
			show.network      = series.network;
			show.overview     = series.overview;
			show.runtime      = series.runtime;
			show.status       = series.status;
			show.banner       = series.banner;
			show.poster       = series.poster;
			show.actors       = [];
			show.seasons      = [];
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
					if(episode.seasonnumber > 0) {
						if(show.noOfEpisodes)
							show.noOfEpisodes++;
						else
							show.noOfEpisodes = 1;
					}
				}
				else {
					show.seasons.push({
						seasonNumber: episode.seasonnumber,
						seasonID    : episode.seasonid,
						episodes    : [episodeObj]
					});
					if(episode.seasonnumber > 0) {
						if(show.noOfSeasons)
							show.noOfSeasons++;
						else
							show.noOfSeasons = 1;

						if(show.noOfEpisodes)
							show.noOfEpisodes++;
						else
							show.noOfEpisodes = 1;
					}
				}
			});

			callback(null);
		},
		function(callback) {
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

					callback(err);
				});
			});
		},
		function(callback) {
			show.save(function(err) {
				if(err)
					return console.error(err);
				callback(null, "Saved successfully");
			});
		}
	], function(err, message) {
		if(err)
			return console.error(err);
		console.log(message);
		if (typeof rootCallback === "function") {
			rootCallback();
		}
	});
};
// This function gets the base series data which excludes the id
// TODO: need to remove sending season data as it's WAY too big. This will be done after splitting the api to accommodate fetching a season
showSchema.methods.getSeriesData = function() {
	return {
		name         : this.name,
		airsDayOfWeek: this.airsDayOfWeek,
		airsTime     : this.airsTime,
		contentRating: this.contentRating,
		firstAired   : this.firstAired,
		genre        : this.genre,
		imdb_id      : this.imdb_id,
		language     : this.language,
		network      : this.network,
		overview     : this.overview,
		runtime      : this.runtime,
		status       : this.status,
		banner       : this.banner,
		poster       : this.poster,
		noOfSeasons  : this.noOfSeasons,
		noOfEpisodes : this.noOfEpisodes,
		actors       : this.actors,
		seasons      : this.seasons
	};
};
// This function is supposed to send season data by getting seasonNumber
// Currently pointless
showSchema.methods.getSeasonData = function(seasonNumber) {
	var seasonIndex = _.findIndex(seasons, { seasonNumber: seasonNumber });
	return this.seasons[seasonIndex];
};

var Show = mongoose.model('Show', showSchema);

mongoose.connect('localhost/bookmybinge');

////////////////////////////
//Defining all the routes //
////////////////////////////

// Search route. Gets search results from TVDB and sends
// TODO: incorporate advanced search by genre, letters etc
// TODO: reduce dependency on external api and search internal db. probably only realistic if db is almost completely cloned
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
			// since explicitArray option doesn't make it an array if there's only one object, we need to detect since client can only accept arrays
			// TODO: a single result redirects user to show/:id
			if(result.data.series instanceof Array)
				res.send(result.data.series);
			else {
				res.send([result.data.series]);
			}
		});
	});
});

// Show Details route. gets the details from mongo if it exists or calls the getSeasonData so it fetches and saves data from TVDB and sends
router.get('/api/show/:id', function(req, res, next) {
	var seriesID = req.params.id;

	Show.findById(seriesID, function(err, show) {
		if(err)
			return next(err);
		if(show) {
			// if(req.query.season) {
			// 	var seasonData = show.getSeasonData(req.query.season);
			// 	if(seasonData)
			// 		res.send(seasonData);
			// 	else
			// 		res.redirect('/show/' + seriesID);
			// }
			// else
			// 	res.send(show.getSeriesData);
			res.send(show.getSeriesData());
		}
		if(!show) {
			var tempShow = new Show({});
			tempShow.fetchShowData(seriesID, function() {
				Show.findById(seriesID, function(err, show) {
					if(err)
						return next(err);
					res.send(show.getSeriesData());
				});
			});
		}
	});
});

// Default route. this makes angular detect the proper route automatically
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

/////////////
// Agenda  //
/////////////

// this agenda job fetches daily update_day from TVDB and adds all series data of seriesid mentioned from series and episodes
agenda.define('fetch update', function(job, done) {
	var apiKey = 'F917081C46B60FCD';

	async.waterfall([
		function(callback) {
			console.log("Fetching updates");
			request.get('http://thetvdb.com/api/' + apiKey + '/updates/updates_day.xml', function(error, response, body) {
				if(error)
					return console.error(error);
				callback(null, body);
			});
		},
		function(body, callback) {
			console.log("Parsing xml");
			xmlParser.parseString(body, function(error, result) {
				if(error)
					return console.error(error);
				callback(null, result);
			});
		},
		function(result, callback) {
			// this portion was necessary since sometimes both series and episode of a single show is updated so to avoid fetching same show data twice
			console.log("Weeding out duplicates");
			_.each(result.data.series, function(show) {
				var duplicateIndex = _.findIndex(result.data.episode, function(episode) {
					return episode.series == show.id;
				});

				if(duplicateIndex > -1) {
					result.data.episode.splice(duplicateIndex, 1);
				}
			});
			callback(null, result.data.series, result.data.episode);
		},
		function(shows, episodes, callback) {
			async.eachSeries(shows, function(show, callback) {
				Show.findByIdAndRemove(show.id, function(err) {
					var tempShow = new Show({});
					tempShow.fetchShowData(show.id, function() {
						callback();
					});
				});
			}, function(err) {
				if(err)
					return console.error(err);
				else
					callback(null, episodes);
			});
		},
		function(episodes, callback) {
			async.eachSeries(result.data.episode, function(episode, callback) {
				Show.findByIdAndRemove(episode.series, function(err) {
					var tempShow = new Show({});
					tempShow.fetchShowData(episode.series, function() {
						callback();
					});
				});
			}, function(err) {
				if(err)
					return console.error(err);
				else
					callback(null, "Update was a success");
			});
		}
	], function(err, message) {
		if(err)
			return console.error(err);
		console.log(message);
		done();
	});
});

// Update fetching runs daily
agenda.every('24 hours', 'fetch update');

// agenda.start();

agenda.on('start', function(job) {
	console.log("Updating has started");
});
agenda.on('complete', function(job) {
	console.log("Updating has ended");
});