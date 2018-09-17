;
(function (window, angular) {
	"use strict";

	angular.module("laicos.ui.video.videogular", [
		'laicos.ui.video.manager'
	])

		.service('laicos.ui.video.Videogular', [
			'$q',
			'laicos.ui.video.Manager',
			function ($q, Manager) {
				var resolver = $q.defer()
				var Videogular = function () {
						return resolver.promise
					},
					active = undefined

				Videogular.abort = function () {
					if (active) {
						active.stop()
					}
				}

				Videogular.onPlay = function (player) {
					if (active && active != player) {
						Videogular.abort()
					}
					active = player
					Manager.onPlay(Videogular)
				}

				Videogular.onStop = function (player) {
					if (active)
						Manager.onStop(Videogular)
				}


				resolver.resolve(Videogular)
				return Videogular
			}
		])

		.directive("laicosUiVideogular", [
			'$timeout',
			'laicos.ui.video.Manager',
			'laicos.ui.video.Videogular',
			function ($timeout, Manager, Videogular) {
				return {
					restrict: "E",
					//template: '<videogular vg-player-ready="_onVgPlayerReady($API)" vg-update-state="_onVgUpdateState($state)"> <vg-media vg-src="activity.player.sources"> </vg-media> <vg-controls> <vg-play-pause-button></vg-play-pause-button> <vg-time-display>{{ currentTime | date:\'mm:ss\' }}</vg-time-display> <vg-scrub-bar> <vg-scrub-bar-current-time></vg-scrub-bar-current-time> </vg-scrub-bar> <vg-time-display>{{ timeLeft | date:\'mm:ss\' }}</vg-time-display> <vg-fullscreen-button></vg-fullscreen-button> </vg-controls> <vg-overlay-play></vg-overlay-play> <vg-poster vg-url="activity.player.plugins.poster"></vg-poster> </videogular>',
					template: '<videogular vg-player-ready="_onVgPlayerReady($API)" vg-update-state="_onVgUpdateState($state)"> <vg-media vg-src="activity.player.sources"> </vg-media> <vg-controls><vg-fullscreen-button></vg-fullscreen-button> </vg-controls> <vg-overlay-play></vg-overlay-play> <vg-poster vg-url="activity.player.plugins.poster"></vg-poster> </videogular>',
					compile: function() {
						return {
							pre: function preLink($scope, $element, $attrs) {
								if (!$element.length) {
									return
								}

								var player

								$scope._onVgPlayerReady = function (p) {
									player = p
								}

								$scope._onVgUpdateState = function (state) {
									console.log('state:', state)
									switch (state) {
										case 'play':
											Videogular.onPlay(player)
											onEvent(Manager.PLAY)
											break
										case 'pause':
										case 'stop':
											Videogular.onStop(player)
											onEvent(Manager.STOP)
											break
									}
								}

								function onEvent(event) {
									$timeout(function () {
										$scope.$eval($attrs.onEvent, {$event: event})
									})
								}
							}
						}
					}
				}
			}
		])


})
(window, window.angular);