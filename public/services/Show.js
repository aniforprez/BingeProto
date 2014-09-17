var BingeApp = angular.module('BingeApp');

BingeApp.factory('Show', ['$resource', function($resource){
	return $resource('/api/shows/:id');
}]);