;
(function (supersonic, angular, laicos) {
	"use strict";

	laicos.console = {
		error: _output('error'),
		debug: _output('debug'),
		info: _output('info'),
		log: _output('info'),
		warn: _output('warn')
	}

	angular.module('laicos.supersonic.console', [
		'supersonic'
	])

		.service('laicos.supersonic.Console', [
			function () {
				return laicos.console
			}
		])

	function _output(type) {
		if (!angular.isString(type)) {
			type = 'log'
		}

		return function () {
			var args = arguments

			setTimeout(function () {
				//var output = Array.prototype.join.call(args, ', ')
				var output = _.map(Array.prototype.slice.call(args), function (value) {
					if (angular.isObject(value)) {
						try {
							value = JSON.stringify(value)
						} catch (e) {
							value = value.toString()
						}
					}
					return value
				})

				var str = typeof device !== "undefined" ? device.platform + ': ' : ''
				str += output.join(', ')
				console.log(type, str)
				supersonic.logger[type].call(supersonic.logger, str)
			}, 1)
		}
	}

})(supersonic, angular, laicos);