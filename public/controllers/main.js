var BingeApp = angular.module('BingeApp');

BingeApp.controller('MainCtrl', ['$scope', '$location', '$timeout', 'Search', function($scope, $location, $timeout, Search){
	var searchDelay;
	$scope.getSearchResults = function() {
		if($scope.searchString) {
			$scope.searchResults = [];
			if(searchDelay)
				$timeout.cancel(searchDelay);
			searchDelay = $timeout(function() {
				$scope.searchResults = Search.query({ searchString: $scope.searchString }, function() {
					if($scope.searchString) {
						$scope.searching = true;
					}
				});
			}, 500);
		}
		else {
			if(searchDelay)
				$timeout.cancel(searchDelay);
			$scope.searching = false;
		}
			// $location.search('name', $scope.searchString).path('/search');
	};
	$scope.goTo = function(link) {
		$location.path(link);
	};
}]);