;
(function (window, angular) {
	"use strict";

	angular.module("laicos.ui.video.manager", [])

		.service('laicos.ui.video.Manager', [
			'$timeout',
			function ($timeout) {
				var listeners = [],
					active
				var Manager = {
					PLAY: 'play',
					STOP: 'stop',

					onPlay: function (platform) {
						//console.log('::onPlay', platform)

						if (active && active != platform) {
							active.abort()
						}
						active = platform
						angular.forEach(listeners, function (cb) {
							if (angular.isFunction(cb)) {
								cb(Manager.PLAY)
							}
						})
					},

					onStop: function (platform) {
						//console.log('::onStop', platform)
						//active = undefined
						angular.forEach(listeners, function (cb) {
							if (angular.isFunction(cb)) {
								cb(Manager.STOP)
							}
						})
					},

					addEventListener: function (cb) {
						listeners.push(cb)
					},

					removeEventListener: function (cb) {
						listeners.splice(listeners.indexOf(cb), 1)
					}


				}
				return Manager
			}
		])

})(window, window.angular);