;
(function (window, angular) {
	"use strict";

	angular.module("laicos.ui.textarea", [])

		.directive("laicosUiTextareaResize", [
			function () {
				return {
					restrict: "A",
					link: function ($scope, $element) {
						var element = $element[0],
							onChange = _.debounce(function (event) {
								element.style.height = ""
								element.style.height = Math.ceil(element.scrollHeight) + "px"
							}, 250)

						$element.on("keyup", onChange)

						$scope.$on("$destroy", function () {
							$element.off("change", onChange)
						})
					}
				}
			}
		])

})(window, window.angular);