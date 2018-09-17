angular
  .module('view-annotator')
  .controller('Annotator', function ($q, $scope, supersonic, util, app, $cordovaFileTransfer, datacontext) {

      var headerOffset = 60;
      var platform = JSON.parse(localStorage.getItem('platform') || '{}');
      if (platform && platform.name != 'iOS') {
          headerOffset = 0;
      }// if

      var vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      var vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

      /* Helpers */
      var _canvas = {
          width: 1440,
          height: 1080
      };

      var _view = {

          init: function (question, resolution) {

              try {


                  $scope.question = question;
                  var path = question.answer.localPath;
                 
                  if (resolution) {
                      _canvas.width = resolution.width || _canvas.width;
                      _canvas.height = resolution.height || _canvas.height;
                  }// if
                                
                  // bind canvas
                  $scope.canvas = new fabric.Canvas('canva', {
                      width: _canvas.width,
                      height: _canvas.height,
                      selection: false
                  });
              
                  $scope.canvas.freeDrawingBrush.width = 2;

                  // add image to canvas
                  fabric.Image.fromURL(path, function (img) {
                  
                      // lock everything
                      img.lockMovementX = true;
                      img.lockMovementY = true;
                      img.lockRotation = true;
                      img.lockScalingFlip = true;
                      img.lockUniScaling = true;
                      img.lockScalingY = true;
                      img.lockScalingX = true;
                      img.hasControls = false;
                      img.hasBorders = false;
                      img.selectable = false;

                      // stretch image to fit canvas
                      img.width = _canvas.width;
                      img.height = _canvas.height;

                      $scope.canvas.add(img);
                  });
                  
                  // listen for canvas path create event and append to list for grouping
                  $scope.canvas.on('path:created', function (options) {
                      $scope.paths.push(options.path);
                  });
                  
                  // calc zoom values
                  var zoom = vw / _canvas.width; // zoom to fit
                  var panx = ((_canvas.width - vw) * zoom)/2 * -1;
                  var pany = ((_canvas.height - vh - headerOffset) * zoom) * -1;

                  // init zoom on element
                  $scope.zoomEle = $('#panzoom').panzoom({
                      minScale: zoom,
                      maxScale: 5
                  })
                    .panzoom("zoom", zoom, { silent: true })
                  .panzoom("pan", panx, pany, { relative: true });

                  $scope.isBusy = false;

              } catch (e) {
                  alert(e);
              }// try-catch

          },

          goBack: function () {

              _view.clear();

              supersonic.ui.layers.pop();
          },

          clear: function () {

              $scope.canvas = null;
              $scope.question = null;
              $scope.mode = 'zoom';
              $scope.brushColor = 'black';
              $scope.zoomEle = null;
              $scope.paths = [];

          },

          generateLocalDestination: function (prefix) {

              var now = new Date();
              
              return localStorage.getItem('absoluteUserFilesPath') + '/' + prefix + '_'
                  + now.toISOString().replace(/:/ig, '').replace(/\./ig, '') + '.jpg';
          }
      };


      /* Scope */
      $scope.question = null;
      $scope.canvas = null;
      $scope.paths = [];
      $scope.brushColor = 'black';
      $scope.zoomEle = null;
      $scope.mode = 'zoom';
      $scope.isBusy = true;

      $scope.cancel = _view.goBack;

      $scope.save = function () {
          
          try {

              $scope.isBusy = true;

              var dataUrl = $scope.canvas.toDataURL({
                  format: 'jpeg'
              });

              // save canvas image
              var path = _view.generateLocalDestination($scope.question.id);
              
              //$cordovaFileTransfer.download(dataUrl, path)
              util.file.download(dataUrl, path)
                .then(function (fileInfo) {
                    
                    // send message to update
                    writeChannel.send({ type: 'annotated', file: fileInfo, question: $scope.question });

                    _view.goBack();

                }, function (e) {
                    
                    supersonic.logger.error('annotator save to file failed - ' + e.toString());
                });

          } catch (e) {
              supersonic.logger.error('annotator save() Exception - ' + e.toString());
          }


      };

      $scope.setBrushColor = function (color) {

          // default to black
          var brushColor = 'rgb(0, 0, 0)';

          $scope.brushColor = color;

          switch (color) {
              
              case 'blue':
                  brushColor = 'rgb(29, 32, 239)';
                  break;

              case 'red':
                  brushColor = 'rgb(204, 0, 0)';
                  break;

              case 'yellow':
                  brushColor = 'rgb(255, 216, 0)';
                  break;

          };

          $scope.canvas.freeDrawingBrush.color = brushColor;

      };

      $scope.setMode = function (mode) {

          $scope.mode = mode;

          switch (mode) {
              case 'zoom':
                  $scope.canvas.isDrawingMode = false;

                  // ending edit mode, group all paths together
                  var cur = null;

                  for (var i = 0; i < $scope.paths.length; i++) {
                      cur = $scope.paths[i];

                      cur.lockMovementX = true;
                      cur.lockMovementY = true;
                      cur.lockRotation = true;
                      cur.lockScalingFlip = true;
                      cur.lockUniScaling = true;
                      cur.lockScalingY = true;
                      cur.lockScalingX = true;
                      cur.hasControls = false;
                      cur.hasBorders = false;
                      cur.selectable = false;

                  }// for

                  $scope.zoomEle.panzoom("enable");

                  break;

              case 'draw':

                  $scope.canvas.isDrawingMode = true;
                  $scope.canvas.freeDrawingBrush.width = 2;
                  $scope.zoomEle.panzoom("disable");
                  break;

              case 'paint':

                  $scope.canvas.isDrawingMode = true;
                  $scope.canvas.freeDrawingBrush.width = 10;
                  $scope.zoomEle.panzoom("disable");
                  break;

                 
          };
          
      };

      $scope.clearAnnotations = function () {
          
          for (var i = 0; i < $scope.paths.length; i++) {
              $scope.paths[i].remove();

          }// for

          $scope.paths = [];

      };

      /* Listeners */
      var writeChannel = new util.message.class.Channel('form_view');

      // listen for view load
      supersonic.ui.views.current.params.onValue(function (params) {

          util.ui.hideNavigationBar();
          
          if (params.question) {

              var question = JSON.parse(params.question);

              $scope.isBusy = true;

              $q.when()
                .then(function () {

                    if (question.answer.remotePath) {

                        // download remote file if exists
                        var dest = _view.generateLocalDestination(question.id);
                        var remote = datacontext.image.getUrl(question.answer.remotePath);

                        var deferred = $q.defer();

                        document.addEventListener("deviceready", function () {

                            // download file locally
                            util.file.download(remote, dest)
                                        .then(function (results) {
                                            deferred.resolve(results.fullPath);
                                        }, function (e) {
                                            deferred.reject();
                                        });
                        }, false);

                        return deferred.promise;

                    } else {
                        return $q.when(question.answer.localPath);
                    }// if-else

                }).then(function (results) {
                    
                    question.answer.localPath = results;

                    _view.init(question, JSON.parse(params.resolution));

                }, function (e) {

                });
        }// if

      });

      // listen for android back button
      document.addEventListener("backbutton", _view.goBack);

      //_view.init();

  });

supersonic.ui.navigationBar.update({
    title: '',
    overrideBackButton: true,
    buttons: {
    }
});