;
(function (angular) {
	"use strict";

	angular.module("laicos.ui.popsauce", [
		"ngAnimate"
	])

		.directive("laicosUiPopsauce", [
			"$document",
			"$animate",
			function ($document, $animate) {
				return {
					restrict: "A",
					require: "laicosUiPopsauce",
					controller: [
						"$scope",
						function ($scope) {
							var poplet,
								self = this,
								isVis = false,
								body = angular.element($document[0].body)

							this.addPoplet = function (element) {
								poplet = element
							}

							this.togglePoplet = function (popsauceRect) {
								isVis
									? self.hidePoplet()
									: self.showPoplet(popsauceRect)
							}

							this.showPoplet = function (popsauceRect) {
								isVis = true
								$animate
									.removeClass(poplet, 'ng-hide')
									/*.then(function () {
										var popletRect = poplet[0].getBoundingClientRect()
										poplet.css({
											left: (popsauceRect.width * 0.5) - (popletRect.width * 0.5) + 'px'
										})
									})*/
								body.on("click", onBodyClick)
								return true
							}

							this.hidePoplet = function () {
								isVis = false
								$animate.addClass(poplet, 'ng-hide')
								body.off("click", onBodyClick)
								return false
							}

							$scope.$on("popsauce:close", self.hidePoplet)

							$scope.$on("$destroy", function () {
								body.off("click", onBodyClick)
							})

							function onBodyClick() {
								$scope.$evalAsync(self.hidePoplet)
							}
						}
					],
					link: function ($scope, $element, $attrs, ctrl) {
						$element.on("click", function () {
							var rect = $element[0].getBoundingClientRect()
							$scope.$evalAsync(function () {
								ctrl.togglePoplet(rect)
							})
						})

						$scope.$on("$destroy", function () {
							$element.off("click", ctrl.togglePoplet)
						})
					}
				}
			}
		])

		.directive("laicosUiPoplet", [
			function () {
				return {
					restrict: "E",
					require: "^laicosUiPopsauce",
					compile: function ($template, $templateAttrs) {
						$template.addClass("ng-hide")
						return function ($scope, $element, $attrs, popSauce) {
							$element.on("click", function (event) {
								event.stopPropagation()
							})
							popSauce.addPoplet($element)
						}
					}
				}
			}
		])

})(window.angular);