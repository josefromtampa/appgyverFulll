;
(function (window, angular) {
	"use strict";

	angular.module("laicos.ui.contenteditable", [])

		.directive('contenteditable', [
			'$timeout',
			'$document',
			'$window',
			function ($timeout, $document, $window) {
				return {
					restrict: 'A',
					require: '?ngModel',
					scope: {
						uiChange: '&'
					},
					link: function ($scope, $element, $attrs, ngModel) {
						if (!ngModel) {
							console.log("laicos.ui.contenteditable missing ngModel")
							return
						}

						$element.on('keyup', onInput)

						if (!angular.isDefined($attrs.allowHtml)) {
							ngModel.$parsers.push(function (value) {
								return value.replace(/<div>/gi, "\n").replace(/(<([^>]+)>)/ig, "")
							})
						}

						ngModel.$render = function () {
							$element.html(ngModel.$viewValue || '')
						}

						function onInput(event) {
							$scope.$evalAsync(function () {
								var value = $element.html()
								/*value = angular.isDefined($attrs.allowHtml)
									? $element.html()
									: $element.text()*/

								ngModel.$setViewValue(value)
								$scope.uiChange({$value: ngModel.$modelValue})

								if (value === '') {
									// the cursor disappears if the contents is empty
									// so we need to refocus
									$scope.$evalAsync(function () {
										$element[0].blur()
										$element[0].focus()
									})
								}
							})
						}

						$scope.$on("$destroy", function() {
							$element.off()
						})
					}
				}
			}])

})(window, window.angular);