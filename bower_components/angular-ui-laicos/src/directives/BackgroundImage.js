;
(function (window, angular) {
	"use strict";

	angular
		.module('laicos.ui.backgroundimage', [])

		.directive('laicosUiBackgroundImage', [
			function () {
				return {
					restrict: 'E',
					link: function ($scope, $element, $attrs) {
						$attrs.$observe('src', function() {
							//console.log($attrs.src, $attrs.size)
							$element.css({
								'background-image': 'url(' +$attrs.src +')',
								'background-size': $attrs.size || 'contain',
								'background-repeat': $attrs.repeat || 'no-repeat',
								'background-position': $attrs.position || 'center'
							})
						})
					}
				}
			}
		])

})(window, window.angular);