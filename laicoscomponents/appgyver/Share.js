;
(function (supersonic, angular, laicos) {
	"use strict";

	angular.module("laicos.supersonic.share", [
		"ngCordova",
		"laicos.supersonic.actionsheet"
	])

		.service("laicos.Share", [
			"$q",
			"$cordovaSocialSharing",
			"laicos.ActionSheet",
			function ($q,
								$cordovaSocialSharing,
								ActionSheet) {

				var Share = {
					checkAvailable: function (wanted) {
						// wanted is a key / value object
						// where key is the desired platform
						// ex:  {facebook: {label: 'Facebook', whatever: 'stuff'}
						// returning a copy w/ unsupported platforms removed

						var deferred = $q.defer(),
							promises = [],
							response = {},
							canShare = {
								'facebook': 'canShareViaFacebook',
								'twitter': 'canShareViaTwitter',
								'whatsapp': 'canShareViaWhatsApp',
								'email': 'canShareViaEmail',
								'sms': 'canShareViaSMS'
							}

						angular.forEach(wanted, function (o, key) {
							if (!angular.isString(key) || !canShare[key]) {
								return
							}
							try {
								$cordovaSocialSharing[canShare[key]]
									.then(function () {
										response[key] = o
									})
							} catch (err) {
							}
						})

						$q.all(promises)
							.then(function () {
								deferred.resolve(response)
							}, function (err) {
								deferred.reject(err)
							})
						return deferred.promise
					}
				}
				return Share
			}
		])

})(supersonic, angular, laicos);