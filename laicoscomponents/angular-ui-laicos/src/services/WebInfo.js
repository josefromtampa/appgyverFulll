;
(function (window, angular) {
	"use strict";

	angular.module("laicos.ui.webinfo", [])

		.service("laicos.ui.WebInfo", [
			'$http',
			'$q',
			'$document',
			function ($http, $q, $document) {
				var WebInfo = {
					parseUrl: function (url) {
						var uri = new URI(url),
							promise

						//console.log(url, uri.domain())
						switch (uri.domain()) {
							case 'youtube.com':
								var query = uri.query()
								promise = $q.resolve({
									source: 'youtube',
									url: url,
									video: query.v
								})
								break;

							case 'youtu.be':
								var id = uri.path().substring(1)
								promise = $q.resolve({
									source: 'youtube',
									url: url,
									video: id
								})
								break;

							case 'vimeo.com':
								var id = uri.path().substring(1)
								promise = $q.resolve({
									source: 'vimeo',
									url: url,
									playUrl: 'https://player.vimeo.com/video/'+id +'?title=0&badge=0&byline=0&portrait=0&api=1&player_id=vimeo-'+id,
									video: id
								})
								break;

							default:
								promise = parseUrl(url)
						}
						return promise
					}
				}
				return WebInfo

				function parseUrl(url) {
					var yql = 'http://query.yahooapis.com/v1/public/yql'
					return $http.get(yql, {
						headers: {
							//'User-Agent': navigator.userAgent
						},
						params: {
							q: 'select * from html where url="' + url + '" and (xpath="//title|//head/meta[@name=' + "'description'" + ']/@content|//head/meta[@property=' + "'og:image'" + ']/@content|//img|//head/link[@rel=' + "'icon'" + ']|//head/link[@rel=' + "'shortcut icon'" + ']")',
							format: 'json'
						}
					})
						.then(function (response) {
							if (response && response.data && response.data.query && response.data.query.results) {
								var info = URI.parse(url),
									video
								info.query = info.query
									? URI.parseQuery(info.query)
									: undefined
								switch (info.hostname) {
									case 'www.youtube.com':
									case 'youtube.com':
									case 'm.youtube.com':
										video = {
											source: 'youtube',
											url: url,
											id: info.query.v
										}
										break;
									case 'www.youtu.be':
									case 'youtu.be':
										var id = info.path.substring(1)
										video = {
											source: 'youtube',
											url: url,
											id: id
										}
										break;
									case 'www.vimeo.com':
									case 'vimeo.com':
										var id = info.path.substring(1)
										video = {
											source: 'vimeo',
											url: url,
											playUrl: 'https://player.vimeo.com/video/'+id +'?title=0&badge=0&byline=0&portrait=0&api=1&player_id=vimeo-'+id,
											id: id
										}
										break;
								}
								return {
									url: url,
									video: video,
									info: info,
									title: response.data.query.results.title,
									description: getDescription(response.data.query.results.meta),
									icon: getIcon(response.data.query.results.link),
									images: getImages(response.data.query.results.meta, response.data.query.results.img)
								}
							}
							throw new Error("WebInfo: malformed response")
						})
				}

				function getIcon(links) {
					return {
						src: (links && links.length) ? links[0].href : undefined
					}
				}

				function getDescription(meta) {
					var description = _.find(meta, function (o) {
						return 'description' == o.name
					})
					return description
						? description.content
						: undefined
				}

				function getImages(meta, img) {
					_.each(meta, function (o) {
						if ('og:image' == o.property) {
							img.unshift({
								src: o.content
							})
						}
					})
					img = _.map(img, function (o) {
						var src = o['data-icon'] || o['data-thumb'] || o.src
						return {
							src: src
						}
					})
					return img
				}
			}
		])

})(window, window.angular);