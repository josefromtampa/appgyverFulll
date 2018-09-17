;(function(window, angular) {
	"use strict";

	angular.module("laicos.ui.busy", [])

		.directive("laicosUiBusy", [
			function() {
				return {
					restrict: 'E',
					link: function($scope, $element, $attrs) {

					}
				}
			}
		])

})(window, window.angular);