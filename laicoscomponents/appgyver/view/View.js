;
(function (supersonic, angular, laicos) {
	"use strict";

	laicos.view = {
		goTo: function (opts) {
			laicos.console.log('goTo', opts)
			if (!angular.isObject(opts))
				opts = {}
			if (!angular.isString(opts.id)) {
				laicos.console.error("View.goTo requires a view id")
				throw new Error("View.goTo requires a view id")
			}
			return supersonic.ui.views
				.find(opts.id)
				.then(function (startedView) {
					laicos.console.log('view:', startedView)
					return supersonic.ui.layers.push(startedView, {
						animation: supersonic.ui
							.animate(opts.animation || 'flipHorizontalFromRight', {
								duration: opts.duration || 0.35,
								curve: opts.curve || 'easeInOut'
							})
					})
				}, function (err) {
					laicos.console.log("err:", err)
				})
				.catch(function (err) {
					laicos.console.log("errrr", err)
				})
		},
		scrollToTop: function (element, to, duration) {
			if (duration < 0)
				return
			var difference = to - element.scrollTop,
				perTick = difference / duration * 10

			setTimeout(function () {
				element.scrollTop = element.scrollTop + perTick
				if (element.scrollTop === to)
					return
				scrollTo(element, to, duration - 10)
			}, 10)
		}
	}

	angular.module('laicos.supersonic.view', [
		'supersonic',
	])

		.directive('laicosNavigate', [
			function () {
				return {
					restrict: 'E',
					transclude: true,
					template: '<div ng-click="onClick()"><ng-transclude></ng-transclude></div>',
					scope: {},
					link: function ($scope, $element, $attrs) {
						$scope.onClick = function () {
							laicos.view.goTo({
								id: $attrs.viewId || $attrs.location,
								duration: $attrs.animDuration,
								curve: $attrs.animCurve
							})
						}
					}
				}
			}
		])

		.service('laicos.supersonic.View', [
			function () {
				return laicos.view
			}
		])

})(supersonic, angular, laicos);