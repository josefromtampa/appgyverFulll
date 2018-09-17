;
(function (window, angular) {
	"use strict";

	angular.module("laicos.ui.video.vimeo", [
		'laicos.ui.video.manager'
	])

		.service("laicos.ui.Vimeo", [
			'$q',
			'laicos.ui.video.Manager',
			function ($q, Manager) {
				var resolver = $q.defer()
				var Vimeo = function () {
						return resolver.promise
					},
					active = undefined

				Vimeo.abort = function () {
					if (active) {
						active.api('pause')
					}
				}

				Vimeo.getActive = function () {
					return active
				}

				Vimeo.getPlayer = function (opts) {
					var resolver = $q.defer()
					var player = Froogaloop(opts.element)
					player.addEvent('ready', function () {
						player.addEvent('play', function () {
							if (active && active != player) {
								Vimeo.abort()
							}

							onPlay(player)
							if (angular.isFunction(opts.onEvent)) {
								opts.onEvent(Manager.PLAY)
							}
						})
						player.addEvent('pause', function () {
							onStop(player)
							if (angular.isFunction(opts.onEvent)) {
								opts.onEvent(Manager.STOP)
							}
						})
						player.addEvent('finish', function () {
							onStop(player)
							if (angular.isFunction(opts.onEvent)) {
								opts.onEvent(Manager.STOP)
							}
						})
						resolver.resolve(player)
					})
					return resolver.promise
				}

				resolver.resolve(Vimeo)

				function onPlay(player) {
					active = player
					Manager.onPlay(Vimeo)
				}

				function onStop(player) {
					if (active)
						Manager.onStop(Vimeo)
				}

				return Vimeo
			}
		])

		.directive('laicosUiVimeo', [
			'$timeout',
			'laicos.ui.Vimeo',
			function ($timeout, Vimeo) {
				return {
					restrict: 'E',
					scope: {
						onEvent: '&',
						playerId: '=',
						playerSrc: '='
					},
					template: '<iframe class="vimeo-player" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>',
					link: function ($scope, $element, $attrs) {
						if (!$element.length) {
							return
						}

						var player,
							playerId = 'vimeo-'+$scope.playerId,
							playerEl = $element[0].querySelector('.vimeo-player')

						//console.log('vimeo::::', playerId, $scope.playerSrc)

						playerEl.setAttribute('id', playerId)
						playerEl.setAttribute('src', $scope.playerSrc)

						//$attrs.$observe('id', function () {
							Vimeo.getPlayer({
								id: playerId,
								element: playerEl,
								onEvent: onEvent
							})
								.then(function (p) {
									player = p
								})
						//})

						function onEvent(event) {
							$timeout(function () {
								$scope.onEvent({
									$event: event
								})
							})
						}
					}
				}
			}
		])


})(window, window.angular);