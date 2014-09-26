var BingeApp = angular.module('BingeApp');

BingeApp.controller('MainCtrl', ['$scope', '$location', function($scope, $location){
	$scope.getSearchResults = function() {
		if($scope.searchString)
			$location.search('name', $scope.searchString).path('/search');
	};
}]);