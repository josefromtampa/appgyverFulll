;
(function (angular) {
	"use strict";

	angular.module("laicos.ui.util", [])

		.service("laicos.ui.util.Strip", [
			function () {
				var Strip = {
					angular: function (value) {
						if (angular.isArray(value)) {
							return _.map(value, Strip.angular)
						} else if (angular.isObject(value)) {
							return _.chain(value)
								.omit(function (value, key) {
									return "$" == key.charAt(0)
								})
								.mapValues(function (value, key) {
									if (_.isObject(value)) {
										return Strip.angular(value)
									}
									return value
								})
								.valueOf()
						}
					}
				}
				return Strip
			}
		])

})(window.angular);