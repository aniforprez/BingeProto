angular.module('BingeApp')
	.controller('DetailCtrl', ['$scope', '$routeParams', 'Show', function($scope, $routeParams, Show){
		Show.get({ _id: $routeParams.id }, function(show) {
			console.log(show);
		});
	}]);