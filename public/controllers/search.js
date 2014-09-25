angular.module('BingeApp')
	.controller('SearchCtrl', ['$scope', '$location', 'Show', function($scope, $location, Show){
		var searchObj = $location.search();
		console.log(searchObj);
		$scope.result = Show.query({ searchString: searchObj.name });
	}]);