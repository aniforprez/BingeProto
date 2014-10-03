var BingeApp = angular.module('BingeApp');

BingeApp.controller('MainCtrl', ['$scope', '$location', '$timeout', 'Search', function($scope, $location, $timeout, Search){
	var searchDelay;
	$scope.getSearchResults = function() {
		if($scope.searchString)
			if(searchDelay)
				$timeout.cancel(searchDelay);
			searchDelay = $timeout(function() {
				$scope.searchResults = Search.query({ searchString: $scope.searchString });
			}, 500);

			// $location.search('name', $scope.searchString).path('/search');
	};
}]);