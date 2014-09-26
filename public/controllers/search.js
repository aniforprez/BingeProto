angular.module('BingeApp')
	.controller('SearchCtrl', ['$scope', '$location', 'Search', function($scope, $location, Search){
		var searchObj = $location.search();
		$scope.searchResults = Search.query({ searchString: searchObj.name });
	}]);