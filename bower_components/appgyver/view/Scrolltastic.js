;
(function (supersonic, angular, laicos) {
	"use strict";

	angular.module("laicos.supersonic.view")

		.service('laicos.supersonic.view.Scrolltastic', [
			'$document',
			'$window',
			'$q',
			function ($document, $window, $q) {
				var body = $document[0].body,
					deferred = $q.defer()
				var Scrolltastic = function () {
					return deferred.promise
				}

				$document.on('scroll', _.debounce(onScroll, 50))

				return Scrolltastic

				function onScroll(event) {
					//console.log('Scrolltastic.onScroll')
					var bottom = $window.innerHeight + body.scrollTop,
						remaining = body.scrollHeight - bottom
					//console.log($window.innerHeight + body.scrollTop, body.scrollHeight)
					deferred.notify({
						scrollTop: body.scrollTop,
						scrollBottom: bottom,
						scrollPercent: bottom / body.scrollHeight,
						remainingPercent: remaining / body.scrollHeight,
						remainingPixels: remaining
					})
				}
			}
		])

		.directive("laicosSuperScroll", [
			'$timeout',
			function ($timeout) {
				return {
					restrict: "A",
					scope: false,
					link: function ($scope, $element, $attrs) {
						var element = $element[0]
						$element.on('scroll', _.debounce(onScroll, 50))

						function onScroll(event) {
							//console.log('laicosSuperScroll.onScroll')
							var bottom = element.offsetHeight + element.scrollTop,
								remaining = element.scrollHeight - bottom,
							//console.log(element.offsetHeight + element.scrollTop, element.scrollHeight)
								event = {
									scrollTop: element.scrollTop,
									scrollBottom: bottom,
									scrollPercent: bottom / element.scrollHeight,
									remainingPercent: remaining / element.scrollHeight,
									remainingPixels: remaining
								}
							$scope.$evalAsync(function () {
								$scope.$eval($attrs.laicosSuperScroll, {$event: event})
							})
						}
					}
				}
			}
		])

})(supersonic, angular, laicos);