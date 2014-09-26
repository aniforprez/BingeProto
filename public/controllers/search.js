angular.module('BingeApp')
	.controller('SearchCtrl', ['$scope', '$location', 'Show', function($scope, $location, Show){
		var searchObj = $location.search();
		$scope.searchResults = Show.query({ searchString: searchObj.name });
	}]);