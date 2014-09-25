var BingeApp = angular.module('BingeApp', ['ngRoute', 'ngMessages', 'ngResource']);

BingeApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

	$locationProvider.html5Mode(true);

	$routeProvider
		.when('/search', {
			templateUrl: 'views/search.html',
			controller : 'SearchCtrl'
		})
		.when('/show/:id', {
			templateUrl: 'views/detail.html',
			controller : 'DetailCtrl'
		})
		.otherwise({
			redirectTo : '/'
		});
}]);