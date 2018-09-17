;
(function (angular) {
	"use strict";

	angular.module("laicos.ui.scroll", [])

		.directive("laicosUiScroll", [
			function () {
				return {
					restrict: "A",
					scope: false,
					link: function ($scope, $element, $attrs) {
						var element = $element[0]
						$element.on('scroll', _.debounce(onScroll, $attrs.scrollDebounce || 50))

						function onScroll(event) {
							var bottom = element.offsetHeight + element.scrollTop,
								remaining = element.scrollHeight - bottom,
								event = {
									scrollTop: element.scrollTop,
									scrollBottom: bottom,
									scrollPercent: element.scrollTop / (element.scrollHeight - element.offsetHeight),
									remainingPercent: remaining / element.scrollHeight,
									remainingPixels: remaining,
									originalEvent: event
								}
							//console.log('laicosUiScroll', event)
							$scope.$evalAsync(function () {
								$scope.$eval($attrs.laicosUiScroll, {$event: event})
							})
						}
					}
				}
			}
		])

})(angular);