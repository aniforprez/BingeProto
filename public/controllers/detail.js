angular.module('BingeApp')
	.controller('DetailCtrl', ['$scope', '$routeParams', 'Show', function($scope, $routeParams, Show){
		Show.get({ id: $routeParams.id }, function(show) {
			console.log(show);
		});
	}]);