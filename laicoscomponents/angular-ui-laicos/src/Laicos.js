;
(function (window, angular) {
	"use strict";

	angular.module('laicos.ui.templates', [])

	angular.module('laicos.ui', [
		'laicos.ui.backgroundimage',
		'laicos.ui.video.youtube',
		'laicos.ui.video.vimeo',
		'laicos.ui.video.videogular',
		"laicos.ui.textarea",
		"laicos.ui.contenteditable",
		"laicos.ui.webinfo",
		"laicos.ui.compile",
		"laicos.ui.templates"
	])

})(window, window.angular);