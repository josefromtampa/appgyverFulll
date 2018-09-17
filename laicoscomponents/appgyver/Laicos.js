var laicos = {
	isAndroid: function () {
		if ("undefined" == typeof device) {
			return true
		}
		return "Android" == device.platform
	}
}

;(function (supersonic, angular, laicos) {
	"use strict";

	angular.module('laicos.supersonic', [
		'laicos.supersonic.console',
		'laicos.supersonic.view',
		'laicos.supersonic.actionsheet',
		'laicos.supersonic.camera',
		'laicos.supersonic.camera'
	])

		.constant('laicos', laicos)

})(supersonic, angular, laicos);