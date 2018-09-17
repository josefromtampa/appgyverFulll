;
(function (window, angular) {
	"use strict";

	angular.module("laicos.ui.swipe", [
		"ngTouch"
	])

		.directive("laicosUiTouchstart", [
			"$parse",
			function ($parse) {
				return {
					restrict: "A",
					link: function ($scope, $element, $attrs) {
						var element = $element[0],
							eventName = 'ontouchstart' in window
								? "touchstart"
								: "mousedown"

						element.addEventListener(eventName, onEvent, false)

						$scope.$on("$destroy", function () {
							element.removeEventListener(eventName, onEvent, false)
						})

						function onEvent(event) {
							$parse($attrs.laicosUiTouchstart)($scope, {$event: event})
						}
					}
				}
			}
		])

		.directive("laicosUiTouchend", [
			"$parse",
			"$document",
			function ($parse, $document) {
				return {
					restrict: "A",
					link: function ($scope, $element, $attrs) {
						var element,
							eventName

						if ('ontouchstart' in window) {
							element = $element[0]
							eventName = "touchstart"
						} else {
							element = $document[0].body
							eventName = "mouseup"
						}

						element.addEventListener(eventName, onEvent, false)

						$scope.$on("$destroy", function () {
							element.removeEventListener(eventName, onEvent, false)
						})

						function onEvent(event) {
							$parse($attrs.laicosUiTouchend)($scope, {$event: event})
						}
					}
				}
			}
		])

		.directive("laicosUiTouchmove", [
			"$parse",
			"$document",
			function ($parse, $document) {
				return {
					restrict: "A",
					link: function ($scope, $element, $attrs) {
						var element,
							eventName

						if ('ontouchstart' in window) {
							element = $element[0]
							eventName = "touchmove"
						} else {
							element = $document[0].body
							eventName = "mousemove"
						}

						element.addEventListener(eventName, onEvent, false)

						$scope.$on("$destroy", function () {
							element.removeEventListener(eventName, onEvent, false)
						})

						function onEvent(event) {
							$parse($attrs.laicosUiTouchmove)($scope, {$event: event})
						}
					}
				}
			}
		])

})(window, window.angular);