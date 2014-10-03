var BingeApp = angular.module('BingeApp', ['ngRoute', 'ngMessages', 'ngResource']);

BingeApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

	$locationProvider.html5Mode(true);

	$routeProvider
		.when('/', {
			templateUrl: 'views/home.html'
		})
		.when('/show/:id', {
			templateUrl: 'views/detail.html',
			controller : 'DetailCtrl'
		})
		.otherwise({
			redirectTo : '/'
		});
}]);