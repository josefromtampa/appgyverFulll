;
(function (supersonic, angular, laicos) {
	"use strict";

	angular.module("laicos.supersonic.actionsheet", [
		"ngCordova"
	])

		.service('laicos.ActionSheet', [
			'$timeout',
			'$q',
			'$cordovaActionSheet',
			function ($timeout, $q, $cordovaActionSheet) {
				var ActionSheet = {
					show: function (opts, noInterval) {
						//laicos.console.log("ActionSheet.show")
						var deferred = $q.defer(),
							cancel
						if (!noInterval) {
							switch (device.platform.toLowerCase()) {
								case 'android':
									cancel = setInterval(function () {
										cordova.exec(null, null, '', '', [])
									}, 100)
									break;
							}
						}

						$cordovaActionSheet
							.show(opts)
							.then(function (index) {
								if (cancel)
									clearInterval(cancel)
								deferred.resolve(index)
							}, function (err) {
								if (cancel)
									clearInterval(cancel)
								deferred.reject(err)
							})

						return deferred.promise
					},

					hide: function (opts) {
						return $cordovaActionSheet.hide(opts)
					}
				}

				return ActionSheet
			}
		])

})(supersonic, angular, laicos);