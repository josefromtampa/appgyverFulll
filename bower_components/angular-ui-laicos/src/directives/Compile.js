;
(function (window, angular) {
	"use strict";

	angular.module("laicos.ui.compile", [])

		.directive("laicosUiCompile", [
			"$parse",
			"$compile",
			function($parse, $compile) {
				return {
					restrict: "A",
					scope: false,
					link: function($scope, $element, $attrs) {
						var content = $parse($attrs.laicosUiCompile)($scope)
						if (content) {
							if ('"' == content.substring(0, 1)) {
								content = content.substring(1)
							}
							if ('"' == content.substring(content.length - 1, 1)) {
								content = content.substring(content.length - 1, 1)
							}
							$element.html(content)
						}
						$compile($element.contents())($scope)
					}
				}
			}
		])

})(window, window.angular);