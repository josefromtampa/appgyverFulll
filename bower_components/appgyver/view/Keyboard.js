;
(function (supersonic, angular, laicos) {
	"use strict";

	angular.module("laicos.supersonic.keyboard", [
		"ngCordova"
	])

		.service("laicos.supersonic.view.Keyboard", [
			"$window",
			function ($window) {
				var listeners = {
						show: {},
						hide: {}
					},
					Keyboard = {
						on: function (methodName, func) {
							if (!angular.isString(methodName) || !angular.isFunction(func)) {
								return
							}
							methodName = methodName.toLowerCase()
							switch (methodName) {
								case 'show':
									addListener(methodName, func)
									break;
								case 'hide':
									addListener(methodName, func)
									break;

								default:
									console.log("laicos.supersonic.view.Keyboard::", "yo, wth is", methodName, "?")
							}
						},
						off: function (methodName, func) {
							if (!angular.isString(methodName) || !angular.isFunction(func)) {
								return
							}
							methodName = methodName.toLowerCase()
							switch (methodName) {
								case 'show':
									removeListener(methodName, func)
									break;
								case 'hide':
									removeListener(methodName, func)
									break;

								default:
									console.log("laicos.supersonic.view.Keyboard::", "yo, wth is", methodName, "?")
							}
						}
					}

				$window.addEventListener('native.keyboardshow', onShow)
				$window.addEventListener('native.keyboardhide', onHide)

				function onShow(event) {
					angular.forEach(listeners.show, function (func, key) {
						func(event)
					})
				}

				function onHide(event) {
					angular.forEach(listeners.hide, function (func, key) {
						func(event)
					})
				}

				function addListener(methodName, func) {
					var key = func["laicos.supersonic.keyboard." + methodName]
						? func["laicos.supersonic.keyboard." + methodName]
						: _.uniqueId("laicos.supersonic.keyboard." + methodName)
					func["laicos.supersonic.keyboard." + methodName] = key
					listeners[methodName][key] = func
				}

				function removeListener(methodName, func) {
					var key = func["laicos.supersonic.keyboard." + methodName]
					delete func["laicos.supersonic.keyboard." + methodName]
					if (!key) {
						return
					}
					delete listeners[methodName][key]
				}

				return Keyboard
			}
		])

		.directive('laicosSuperFooter', [
			"$window",
			"$document",
			"$parse",
			"laicos.supersonic.view.Keyboard",
			function ($window, $document, $parse, Keyboard) {
				return {
					restrict: "A",
					scope: false,
					link: function ($scope, $element, $attrs) {
						$document[0].addEventListener("deviceready", function () {
							if (laicos.isAndroid()) {
								return
							}
							Keyboard.on("show", onShow)
							Keyboard.on("hide", onHide)
						}, false)

						function onShow(event) {
							$element.addClass('keyboard-is-open')
							$element.css({
								bottom: event.keyboardHeight + 'px'
							})
							if (angular.isDefined($attrs.onKeyboardShow)) {
								$parse($attrs.onKeyboardShow)($scope, {$event: event})
							}
						}

						function onHide(event) {
							$element.removeClass('keyboard-is-open')
							$element.css({
								bottom: '0px'
							})
							if (angular.isDefined($attrs.onKeyboardHide)) {
								$parse($attrs.onKeyboardHide)($scope, {$event: event})
							}
						}

						$scope.$on("$destroy", function () {
							Keyboard.off("show", onShow)
							Keyboard.off("hide", onHide)
						})
					}
				}
			}
		])

		.directive('laicosSuperFixedKeyboard', [
			"$window",
			function ($window) {
				return {
					restrict: "A",
					scope: false,
					link: function ($scope, $element, $attrs) {
						$element.on('focus', function (event) {
							event.preventDefault()
							event.stopPropagation()
							setTimeout(function () {
								$window.scrollTo(0, 1)
							}, 1)
						})
					}
				}
			}
		])

		.run([
			"$window",
			"$document",
			"$cordovaKeyboard",
			"laicos.supersonic.view.Keyboard",
			function ($window, $document, $cordovaKeyboard, Keyboard) {
				var body
				$document[0].addEventListener("deviceready", function () {
					if (laicos.isAndroid()) {
						return
					}
					body = angular.element($document[0].body)
					$cordovaKeyboard.disableScroll(true)
					Keyboard.on("show", onShow)
					Keyboard.on("hide", onHide)
				}, false)

				function onShow(event) {
					console.log('onShow', $window.innerHeight+' - '+$document[0].body.offsetHeight)
					body.addClass('keyboard-is-open')
					body.css({
						'max-height': $window.innerHeight + 'px'
					})
				}

				function onHide(event) {
					console.log('onHide', $window.innerHeight+' - '+$document[0].body.offsetHeight)
					body.removeClass('keyboard-is-open')
					body.css({
						'max-height': 'initial'
					})
				}
			}
		])

})(supersonic, angular, laicos);