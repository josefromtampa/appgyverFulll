;
(function (supersonic, angular, laicos) {
    "use strict";

    angular.module("laicos.supersonic.camera", [
		"ngCordova",
		"laicos.supersonic.actionsheet"
    ])

		.service("laicos.Camera", [
			"$q",
			'$timeout',
			'$window',
			"laicos.ActionSheet",
			"$cordovaCapture",
			"$cordovaCamera",
			"$cordovaImagePicker",
			function ($q,
								$timeout,
								$window,
								ActionSheet,
								$cordovaCapture,
								$cordovaCamera,
								$cordovaImagePicker) {
			    var CameraService = {

			        video: function (opts) {
			            //laicos.console.log('video')
			            if (!angular.isObject(opts))
			                opts = {}
			            opts.mediaType = 1
			            /*if (1 == 2 && laicos.isAndroid()) {
						 return CameraService.launch(opts, true)
						 } else {*/
			            opts.buttons = ['Record a Video', 'Choose from Gallery']
			            return CameraService.prompt(opts)
			            //}
			        },

			        photo: function (opts) {
			            //laicos.console.log('photo')
			            if (!angular.isObject(opts))
			                opts = {}
			            opts.mediaType = 0
			            opts.buttons = ['Take a Photo', 'Choose from Gallery']
			            return CameraService.prompt(opts)
			        },

			        prompt: function (opts) {
			            //laicos.console.log('prompt')
			            if (!angular.isObject(opts))
			                opts = {}
			            var wrapper = wrap(),
							defaultOptions = ['Use Camera', 'Choose from Gallery']
			            if (opts.mediaType) {
			                defaultOptions.length = 1
			            }
			            ActionSheet
							.show({
							    //title: "Choose a Source",
							    title: opts.title || undefined,
							    buttonLabels: opts.buttons || defaultOptions,
							    addCancelButtonWithLabel: 'Cancel'
							    //androidEnableCancelButton: true,
							    //winphoneEnableCancelButton: true
							}, true)
							.then(function (index) {
							    switch (index) {
							        case 1:
							            return CameraService.launch(opts, true)

							        case 2:
							            return CameraService.gallery(opts, true)

							        default:
							            wrapper.deferred.reject()
							    }
							})
							.then(function (response) {
							    wrapper.deferred.resolve(response)
							})
							.catch(function (err) {
							    wrapper.deferred.reject(err)
							})
							.finally(function () {
							    if (wrapper.cancel)
							        clearTimeout(wrapper.cancel)
							})
			            return wrapper.deferred.promise
			        },

			        launch: function (opts, noInterval) {

			            //laicos.console.log('launch')
			            if (!angular.isObject(opts))
			                opts = {}
			            var wrapper = wrap(noInterval),
							method
			            opts = angular.extend({
			                limit: 1
			            }, opts)
			            switch (opts.mediaType) {
			                case 0:
			                    method = $cordovaCapture.captureImage
			                    break;
			                case 1:
			                    method = $cordovaCapture.captureVideo
			                    if (!angular.isNumber(opts.duration))
			                        opts.duration = 10
			                    break;
			            }
			            method(angular.extend(opts))
							.then(function (response) {
							    //alert(JSON.stringify(response));
							    return moveFiles(response, opts)
							})
							.then(function (files) {
							    if (opts.mediaType == 1) {
							        return generateThumbs(files)
							    }
							    return files
							})
							.then(function (files) {
							    wrapper.deferred.resolve(files)
							})
							.catch(function (err) {
							    wrapper.deferred.reject(err)
							})
							.finally(function () {
							    if (wrapper.cancel)
							        clearTimeout(wrapper.cancel)
							})
			            return wrapper.deferred.promise
			        },

			        camera: function (opts, noInterval) {

			            //laicos.console.log('launch')
			            if (!angular.isObject(opts))
			                opts = {}
			            var wrapper = wrap(noInterval),
							method
			            opts = angular.extend({
			                limit: 1,
			                destinationType: Camera.DestinationType.FILE_URI,
			                sourceType: Camera.PictureSourceType.CAMERA,
			                correctOrientation: true,
			            }, opts);


			            $cordovaCamera.getPicture(angular.extend(opts))
							.then(function (response) {

							    var idx = response.lastIndexOf('/');
							    var filename = response.substring(idx + 1);

							    var files = [{
							        name: filename,
							        fullPath: response
							    }];

							    return moveFiles(files, opts)
							})
							.then(function (files) {

							    if (opts.mediaType == 1) {
							        return generateThumbs(files)
							    }
							    return files
							})
							.then(function (files) {
							    wrapper.deferred.resolve(files)
							})
							.catch(function (err) {
							    wrapper.deferred.reject(err)
							})
							.finally(function () {
							    if (wrapper.cancel)
							        clearTimeout(wrapper.cancel)
							})

			            return wrapper.deferred.promise
			        },

			        gallery: function (opts, noInterval) {
			            //console.log('Camera.gallery()')
			            if (!angular.isObject(opts))
			                opts = {}
			            if (!angular.isDefined(opts.mediaType))
			                opts.mediaType = 0
			            var wrapper = wrap(noInterval),
							filePromise

			            if (opts.mediaType == 0) {
			                filePromise = $cordovaImagePicker
								.getPictures(angular.extend({
								    maximumImagesCount: 3,
								    width: 720,
								    height: 720,
								    quality: 60
								}, opts))
								.then(function (files) {
								    files = angular.isArray(files)
										? files
										: [files]
								    return moveFiles(files, opts)
								})
			            } else {
			                filePromise = $cordovaCamera
								.getPicture(angular.extend({
								    quality: 60,
								    targetWidth: 720,
								    destinationType: Camera.DestinationType.FILE_URI,
								    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
								    allowEdit: true,
								    encodingType: Camera.EncodingType.JPEG,
								    mediaType: opts.mediaType,
								    correctOrientation: true,
								    saveToPhotoAlbum: false
								}, opts))

								.then(function (files) {
								    files = angular.isArray(files) ? files : [files]
								    if (laicos.isAndroid()) {
								        if (opts.mediaType == 1)
								            return hackVideos(files)
								        else
								            return hackImages(files)
								    }
								    return files
								})
								.then(function (files) {
								    return moveFiles(files, opts)
								})
								.then(function (files) {
								    if (opts.mediaType == 1) {
								        return generateThumbs(files)
								    }
								    return files
								})
			            }

			            filePromise
							.then(function (files) {
							    //console.log('success', files)
							    wrapper.deferred.resolve(files)
							}, function (err) {
							    //console.log('error', err)
							    wrapper.deferred.reject(err)
							})
							.finally(function () {
							    if (wrapper.cancel)
							        clearTimeout(wrapper.cancel)
							})

			            return wrapper.deferred.promise
			        }
			    }

			    function hackImages(files) {
			        //console.log('hackImages', files)
			        return _.map(files, function (fileURI) {
			            fileURI = fileURI.split("image:")
			            return "content://media/external/images/media/" + fileURI[1]
			        })
			    }

			    function hackVideos(files) {
			        //console.log('hackVideos', files)
			        return _.map(files, function (fileURI) {
			            fileURI = fileURI.split("video:")
			            return "content://media/external/video/media/" + fileURI[1]
			        })
			    }

			    function generateThumbs(files) {
			        //console.log('generateThumbs', files)
			        var deferred = $q.defer()
			        async.map(files, function (file, cb) {
			            var onSuccess = function (thumb) {
			                file.thumb = '/' + file.name + '-thumb'
			                cb(null, file)
			            },
							onError = cb
			            $window.PKVideoThumbnail
							.createThumbnail(
							file.nativeURL,
							file.directory + file.name + '-thumb',
							onSuccess,
							onError
						)
			        }, function (err, result) {
			            if (err) {
			                return deferred.reject()
			            }
			            deferred.resolve(result)
			        })
			        return deferred.promise
			    }

			    function moveFiles(files, opts) {
			        //console.log('moveFiles', files)
			        var deferred = $q.defer(),
						userDirPath = "file://" + steroids.app.absoluteUserFilesPath,
						onError = function (err) {
						    deferred.reject(err)
						}

			        $window.resolveLocalFileSystemURI(userDirPath, function (userDir) {
			            //console.log('userDirPath', userDir)
			            async.map(files, function (fileinfo, cb) {


			                try {
			                    var path,
                                    fullPath = angular.isObject(fileinfo) ? fileinfo.fullPath : fileinfo;

			                    //alert(fullPath);
			                    if (laicos.isAndroid()) {
			                        path = fullPath;
			                    } else {

			                        path = (fullPath.indexOf('file://') > -1 ? '' : "file://") + fullPath;

			                    }
			                    //alert('path:' + path)
			                    $window.resolveLocalFileSystemURL(path, function (file) {
			                        //console.log('copy file', file)
			                        var filename = new Date().getTime() + s4() + "-" + file.name.replace(/[^a-zA-Z0-9\.]+/g, "-")
			                        // p.o.s. socialengine requires a fileextension
			                        if (opts.mediaType && laicos.isAndroid()) {
			                            filename += ".mp4"
			                        }
			                        //alert('copying to ' + userDir + ' ' + filename);
			                        file.copyTo(userDir, filename, function (movedFile) {
			                            cb(null, angular.extend(movedFile, {
			                                localPath: '/' + filename,
			                                content: fileinfo,
			                                directory: userDirPath + "/"
			                                //original: file
			                            }))
			                        }, cb)
			                    }, cb)
			                } catch (e) {
			                    deferred.reject(e);
			                }
			            }, function (err, result) {
			                if (err)
			                    return onError(err)
			                deferred.resolve(result)
			            })
			        }, onError)

			        return deferred.promise
			    }

			    function wrap(noInterval) {
			        var cancel

			        if (!noInterval) {
			            switch (device.platform.toLowerCase()) {
			                case 'android':
			                    cancel = setInterval(function () {
			                        cordova.exec(null, null, '', '', [])
			                    }, 100)
			                    break
			            }
			        }
			        return {
			            deferred: $q.defer(),
			            cancel: cancel
			        }
			    }

			    function guid() {
			        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
						s4() + '-' + s4() + s4() + s4();
			    }

			    function s4() {
			        return Math.floor((1 + Math.random()) * 0x10000)
						.toString(16)
						.substring(1);
			    }

			    return CameraService
			}
		])

})(supersonic, angular, laicos);