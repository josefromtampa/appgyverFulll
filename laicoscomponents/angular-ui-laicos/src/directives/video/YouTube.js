;
(function (window, angular) {
	"use strict";

	angular.module("laicos.ui.video.youtube", [
		'laicos.ui.video.manager'
	])

		.factory('laicos.ui.YouTube', [
			'$document',
			'$window',
			'$q',
			'laicos.ui.video.Manager',
			function ($document, $window, $q, Manager) {
				var resolver = $q.defer(),
					origin = window.location.protocol+'//'+window.location.hostname+(window.location.port ? ':'+window.location.port: '')

				var YouTube = function () {
						return resolver.promise
					},
					active = undefined

				YouTube.abort = function () {
					if (active)
						active.stopVideo()
				}

				YouTube.getActive = function () {
					return active
				}

				YouTube.getPlayer = function (opts) {
					var resolver = $q.defer()
					YouTube()
						.then(function () {
							if (!opts.id) {
								return resolver.reject('id is required', opts.id)
							}
							var player = new YouTube._api.Player(opts.id, {
								width: '100%',
								height: '100%',
								playerVars: {
									enablejsapi: 1,
									rel: 0,
									autoplay: 0,
									controls: 0,
									showinfo: 0
								},
								origin: origin,
								videoId: opts.videoId,
								events: {
									onReady: function (event) {
										if (angular.isFunction(opts.onReady))
											opts.onReady(event)
									},
									onStateChange: function (event) {
										//console.log('onStateChange', event)
										switch (event.data) {
											case YouTube._api.PlayerState.ENDED:
											case YouTube._api.PlayerState.PAUSED:
												Manager.onStop(YouTube)
												opts.onEvent(Manager.STOP)
												break
											case YouTube._api.PlayerState.PLAYING:
												if (active && active != player) {
													YouTube.abort()
												}
												active = player
												Manager.onPlay(YouTube)
												opts.onEvent(Manager.PLAY)
												break
										}

										//if (angular.isFunction(opts.onStateChange))
										//	opts.onStateChange(event)
									}
								}
							})
							resolver.resolve(player)
						})
					return resolver.promise
				}

				var scriptTag = $document[0].createElement('script')
				scriptTag.type = 'text/javascript'
				scriptTag.async = true
				scriptTag.src = 'https://www.youtube.com/player_api'
				scriptTag.onreadystatechange = function () {
					if (this.readyState == 'complete')
						onScriptLoad()
				}
				scriptTag.onload = onScriptLoad()

				var s = $document[0].getElementsByTagName('body')[0]
				s.appendChild(scriptTag)

				function onScriptLoad() {
					window.onYouTubePlayerAPIReady = function () {
						YouTube._api = window.YT
						resolver.resolve(YouTube)
					}
				}

				return YouTube

			}])

		.directive('laicosUiYoutube', [
			'$timeout',
			'laicos.ui.YouTube',
			function ($timeout, YouTube) {
				return {
					restrict: 'E',
					scope: {
						onEvent: '&',
						playerId: '=',
						playerSrc: '='
					},
					template: '<div class="youtube-player"></div>',
					link: function ($scope, $element, $attrs) {
						if (!$element.length) {
							return
						}

						var player,
							playerId = 'youtube-'+$scope.playerId,
							playerEl = $element[0].querySelector('.youtube-player')

						//console.log('youtube::::', playerId, $scope.playerSrc)

						playerEl.setAttribute('id', playerId)

						//$attrs.$observe('id', function () {
							YouTube()
								.then(function (YouTube) {
									YouTube.getPlayer({
										id: playerId,
										videoId: $scope.playerSrc,
										onEvent: onEvent
									})
										.then(function (p) {
											player = p
										})
								})
						//})

						function onEvent(event) {
							$timeout(function () {
								$scope.onEvent({$event: event})
							})
						}
					}
				}
			}
		])


})(window, window.angular);