var BingeApp = angular.module('BingeApp', ['ngRoute', 'ngMessages', 'ngResource']);

MyApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

	$locationProvider.html5Mode(true);

	$routeProvider
		.when('/', {
			templateUrl: '',
			controller : ''
		})

}]);