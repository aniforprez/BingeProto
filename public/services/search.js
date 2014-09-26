var BingeApp = angular.module('BingeApp');

BingeApp.factory('Search', ['$resource', function($resource) {
	return $resource('/api/search');
}]);