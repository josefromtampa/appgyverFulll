angular
  .module('view-form')
  .controller('FormController', [
      '$scope', '$timeout', '$q', 'supersonic', 'util', 'datacontext', 'app', 'forms', 'laicos.Camera', '$filter',
  function ($scope, $timeout, $q, supersonic, util, datacontext, app, forms, Camera, $filter) {

      var _debug = false;

      /* Helpers */
      var _view = {

          init: function (type, form) {

              if (form) {

                  _view.reset();

                  $scope.isBusy = true;
                  $scope.type = type;
                  $scope.goingBack = false;

                  var id = form._id;

                          // get form
                  switch (type) {

                      case 'userForm':
                          _view.loadForm(id);
                          break;

                      case 'template':
                          _view.loadNew(id);            
                          break;

                      default:
                          // error 
                          supersonic.logger.error('Invalid form type ' + type);
                          break;

                  };                


              }// if

          },

          reset: function () {
              
              //alert('resetting');
              $scope.$evalAsync(function () {
                  $scope.root = null;
                  $scope.type = '';
                  $scope.isBusy = true;
                  $scope.userForm = null;
                  $scope.showReview = false;
                  $scope.busyMessage = '';
                  $scope.dependencyList = null;
                  $scope.userForm = { form: {} };
                  $scope.formLength = 0;
                  $scope.currentPosition = 0;
                  $scope.showReview = false;
                  $scope.readOnly = false;
                  $scope.disable = false;
                  $scope.cardData = [];
              });
          },

          goBack: function (save) {

              save = save || false;
              $scope.goingBack = true;

              $scope.$evalAsync(function () {
                  $scope.currentPosition = 0;
              });

              $timeout(function () {
                  supersonic.ui.layers.pop();
              });

              if (save) {
                  // auto-save
                  return _data.save()
                    .then(function (results) {
                        _view.reset();
                        return results;
                    });
              } else {
                  _view.reset();
              }

              return $q.when(true);
          },

          loadForm: function (id) {

              // get user form cards
              datacontext.forms.getForm(id)
                     .then(function (response) {

                         if (response.success) {
                             
                             _view.bind(response.data);
                         } else {
                             supersonic.logger.warn('form.js _view.init() Unable to retrieve user form cards - ' + response.message);
                         }// if-else

                     }, function (e) {

                         supersonic.logger.error('form.js _view.init() Exception retrieving user form cards - ' + e);
                         _view.bind();
                     });
          },
          
          loadNew: function (id) {
  
            // get template cards
              datacontext.forms.getTemplateCards(id)
                     .then(function (response) {

                         if (response.success) {

                             var newForm = response.data;

                             // prompt for form info first
                             var options = {
                                 title: 'New Form',
                                 buttonLabels: ["Done", "Cancel"],
                                 defaultText: newForm.name
                             };

                             function loadForm(name) {
                                 
                                 if (name) {

                                     $scope.$evalAsync(function () {

                                         newForm.name = name;
                                         _view.bind(newForm, true);

                                     });
                                 } else {
                                     
                                     // delete form
                                     datacontext.forms.delete(newForm.id);

                                     _view.goBack();
                                 }// if-else
                             }
                             
                             var platform = localStorage.getItem('platform');
                             platform = platform ? JSON.parse(platform) : null;

                             if (platform && platform.name === 'Android') {
                                supersonic.ui.dialog.prompt('Please name this form:', options)
                                    .then(function (result) {
                                        loadForm(result.buttonIndex !== 1 ? result.input : null);

                                    });
                            } else {
                                // appgyver ios has a weird bug in native prompt plugin that displays textbox only one character wide - use js promt instead
                                _view.prompt('Form Name', 'Please name this form:', newForm.name, function (name) {
                                        loadForm(name);
                                    });
                            }// if-else

                         } else {
                             supersonic.logger.warn('form.js _view.init() Unable to retrieve template cards - ' + response.message);
                         }// if-else


                     }, function (e) {
                         supersonic.logger.error('form.js _view.init() Exception retrieving template cards - ' + e.message);
                         _view.bind();
                     });
          },

          bind: function (userForm, getLocation) {
              
              try {

                  getLocation = getLocation || false;

                  if (userForm) {

                      $scope.userForm = userForm;
                      $scope.formLength = userForm.form.cards.length;
                      $scope.readOnly = userForm.status && userForm.status.key == 'submitted';
                                            
                      if (getLocation) {
                          supersonic.ui.dialog.confirm('Use Current Location?', {
                              message: 'Would you like to tag this form with your current location?',
                             buttonLabels: ['Yes', 'No']
                          }).then(function (index) {

                              if (index == 0) {
                                  // get gps
                                  supersonic.device.geolocation.getPosition()
                                      .then(function (position) {

                                          $scope.userForm.gps = {
                                              longitude: position.coords.longitude,
                                              latitude: position.coords.latitude
                                          };
                                          
                                          if (position && position.coords) {
                                              _data.saveGPS();
                                          }// if

                                      });
                              }// if
                          });
                      }// if

                      $scope.isBusy = false;
                      _data.refreshDependencyList();
                      $scope.cards = $filter('cardDependencyFilter')(userForm.form.cards, $scope.dependencyList);

                      if (userForm.progress.currentPosition > 0) {
                          var pos = userForm.progress.currentPosition;
                          $timeout(function () {
                              $scope.currentPosition = pos;
                          }, 1000);
                      }// if

                      // send message to progress drawer
                      writeChannel.send({
                          type: 'init',
                          data: {
                              userForm: userForm,
                              progressCards: $scope.cards
                          }
                      });
                    
                  } else {

                      $timeout(function () {
                          _view.loadError('Form not found');
                      }, 500);

                  }// if-else
              } catch (e) {
                  alert(e.message);
                  _view.loadError(e.message);
              }// try-catch
          },

          loadError: function (message) {

              supersonic.logger.error('form.js bind() ' + message);

                supersonic.ui.dialog.alert('Unable to Load Form', {
                    message: 'Sorry... we are unable to load your specified form at this moment',
                    buttonLabel: 'OK'
                }).then(function () {
                    _view.goBack();
                });

          },

          errorPrompt: function (title, message) {

              supersonic.logger.error('form.js Error ' + message);

              supersonic.ui.dialog.alert(title, {
                  message: message,
                  buttonLabel: 'OK'
              });
          },

          prompt: function (title, message, value, done) {

              $scope.prompt.title = title;
              $scope.prompt.message = message;
              $scope.prompt.value = value;
              $scope.prompt.callback = function () {

                  $scope.prompt.show = false;
                  $scope.prompt.title = '';
                  $scope.prompt.message = '';

                  if (done) done($scope.prompt.value);

                  $scope.prompt.value = '';

              };
              $scope.prompt.show = true;
              
          }
      };

      var _data = {

          setProgressPosition: function (nextPos) {

              if ($scope.userForm && $scope.userForm.progress) {
                  $timeout(function () {

                      $scope.userForm.progress.currentPosition = $scope.currentPosition;

                      var progressPos = $scope.userForm.progress.progressPosition;

                      // increment progress position if greater
                      if (progressPos < nextPos || progressPos === undefined || progressPos == null) {
                          $scope.userForm.progress.progressPosition = nextPos;

                          writeChannel.send({
                              type: 'progressUpdate',
                              data: {
                                  progress: nextPos,
                                  progressCards: $scope.cards
                              }
                          });

                      }// if

                      try {
                          $scope.userForm.progress.percent = _data.calculatePercent();

                          if (!$scope.goingBack) {
                              _data.saveProgress();
                          }// if
                      } catch (e) {

                      }// try-catch
                  });
              }// if
          },

          calculatePercent: function () {

              try {
                  var position = $scope.userForm.progress.progressPosition;
                  var length = $scope.cards.length;

                  if (position > 0 && length > 0) {

                      return Math.round((position / (length - 1)) * 100);

                  } else {
                      return 0;
                  } // if-else
              } catch (e) {
                  alert('Error: ' + e.message);
              }// try-catch
          },

          getIdentifier: function(){

              try {

                  var timeStamp = new Date();

                  // just use form name for now
                  var identifier = $scope.userForm.identifier || $scope.userForm.form.name + ' - '
                                                                    + $scope.userForm.user.username.toUpperCase() + ' - '
                                                                    + timeStamp.toLocaleString().replace(/\//ig, '-').replace(/,/ig, '').replace(/:/ig, '-');

                  return identifier;

              } catch (e) {
                  supersonic.logger.error('form.js getIdentifier() Exception - ' + e.toString());
              }// try-catch
          },

          refreshDependencyList: function () {

              // flatten questions
              $scope.dependencyList = forms.data.flattenUserFormQuestions($scope.userForm,
                                    function (question) {
                                        return question.hasDependents;
                                    });

          },

          save: function () {
              
              if ($scope.userForm.status === undefined || $scope.userForm.status.key == 'saved') {

                  $scope.isBusy = true;
                  //$scope.busyMessage = 'Saving...'

                  
                  // recalculate progress
                  $scope.userForm.progress.percent = _data.calculatePercent();
                 // $scope.userForm.identifier = _data.getIdentifier();
                  $scope.userForm.status = { name: 'Saved', key: 'saved' };

                  if (_debug) {
                      alert('Saving photos');
                  }// if

                  // upload all images
                  return _data.uploadPhotos()
                            .then(function (results) {

                                // build fields to update
                                var updateFields = {
                                    name: $scope.userForm.name,
                                    progress: $scope.userForm.progress,
                                    status: $scope.userForm.status,
                                    gps: $scope.userForm.gps
                                };

                                if (_debug) {
                                    alert('Photos Saved');
                                   
                                }// if

                                var curCard = null,
                                    curQ = null;
                                // resave all photo cards again with updated remote references
                                for (var i = $scope.userForm.form.cards.length; i--;) {

                                    curCard = $scope.userForm.form.cards[i];

                                    for (var j = curCard.questions.length; j--;) {
                                        curQ = curCard.questions[j];
                                        if (curQ.type.key == 'photo' && curQ.answer) {
                                            if (_debug) {
                                                alert('Re-saving card index ' + i + ' after photo upload');
                                                alert('Photo question is ' + JSON.stringify(curQ));
                                            }// if

                                            // save card reference again
                                            _data.saveCardObj($scope.userForm.id, curCard);
                                            break;
                                        }// if

                                    }// for

                                }// for

                                // save stuff
                                return datacontext.forms.update($scope.userForm.id, updateFields)
                                          .then(function (results) {

                                              // send save message
                                              util.message.broadcastAppEvent('form_saved', $scope.userForm);

                                              $scope.isBusy = false;
                                              $scope.busyMessage = '';

                                              if (_debug) {
                                                  alert('Form saved');
                                              }// if
                                              
                                              return results;
                                          }, function (e) {

                                              // TODO: if can't save remotely then cache locally

                                              if (_debug) {
                                                  alert('Error saving form ' + JSON.stringify(e));
                                              }// if

                                              $scope.isBusy = false;
                                              $scope.busyMessage = '';
                                              _view.errorPrompt('Unable to Save', 'Sorry, we are unable to save your form at this moment');

                                          });
                            }, function (e) {

                                // TODO: cache form locally

                                if (_debug) {
                                    alert('Error saving photos ' + JSON.stringify(e));
                                }// if

                                $scope.isBusy = false;
                                $scope.busyMessage = '';
                                _view.errorPrompt('Unable to Save Photos', 'Sorry, we are unable to save your form at this moment');
                            });
              } else {

                  return $q.defer().resolve();
              }// if-else

          },

          saveCardObj: function (id, card) {

              if (id && card) {

                  // save card
                  return datacontext.forms.saveCard(id, card)
                            .then(function (results) {

                                if (results.success) {

                                    // util.message.broadcastAppEvent('form_card_saved', card);

                                    supersonic.logger.info('_data.saveCard() - Card saved');

                                    if (_debug) {
                                        alert('Card saved');
                                    }// if

                                }// if

                                return results;

                            }, function (e) {


                                if (_debug) {
                                    alert('Card not saved ' + JSON.stringify(e));
                                }// if
                                // TODO: if can't save remotely then cache locally

                                supersonic.logger.error('_data.saveCard() - Unable to save form card - ' + JSON.stringify(e));

                                return $q.reject('Unable to save form card');
                            });
              } else {
                  return $q.resolve('Form ID and card required');
              }// if-else
          },
          
          saveCard: function(index){

              if ($scope.cards) {
                  // get card based on index and save if dirty
                  var card = $scope.cards[index];
                  var id = $scope.userForm ? $scope.userForm.id : null;
                  
                  return _data.saveCardObj(id, card);

              }// if
          },

          saveGPS: function () {

              if ($scope.userForm && $scope.userForm.id) {
                  
                  //alert('saving gps location ' + JSON.stringify($scope.userForm.gps)); 

                // save progress
                  return datacontext.forms.saveGPS($scope.userForm.id, $scope.userForm.gps)
                            .then(function (results) {

                                if (results.success) {
                                    //alert('gps saved');
                                    supersonic.logger.info('_data.saveGPS() - GPS saved');

                                }// if

                                return results;

                            }, function (e) {


                                // TODO: if can't save remotely then cache locally
                                //alert('unable to save gps ' + e);

                                supersonic.logger.error('_data.saveGPS() - Unable to save form progress - ' + JSON.stringify(e));

                                return $q.when('Unable to save form gps');
                            });

              }// if
          },

          saveProgress: function () {

              if ($scope.userForm && $scope.userForm.id) {

                  // save progress
                  return datacontext.forms.saveProgress($scope.userForm.id, $scope.userForm.progress)
                            .then(function (results) {

                                if (results.success) {

                                    // util.message.broadcastAppEvent('form_card_saved', card);

                                    supersonic.logger.info('_data.saveProgress() - Progress saved');

                                }// if

                                return results;

                            }, function (e) {


                                // TODO: if can't save remotely then cache locally

                                supersonic.logger.error('_data.saveProgress() - Unable to save form progress - ' + JSON.stringify(e));

                                return $q.reject('Unable to save form progress');
                            });

              }// if
          },

          submit: function () {

              try {
                  $scope.isBusy = true;

                  // recalculate progress
                  $scope.userForm.progress.percent = _data.calculatePercent();
                  // $scope.userForm.identifier = _data.getIdentifier();
                  $scope.userForm.status = { name: 'Submitted', key: 'submitted' };
                  
                  // upload photos
                  return _data.uploadPhotos()
                          .then(function (userForm) {

                              // build fields to update
                              var updateFields = {
                                  progress: $scope.userForm.progress,
                                  status: $scope.userForm.status
                              };
                              
                              // save stuff
                              return datacontext.forms.update($scope.userForm.id, updateFields)
                                        .then(function (results) {

                                            // send submit message
                                            util.message.broadcastAppEvent('form_submitted', $scope.userForm);

                                            return results;
                                        }, function (e) {
                                            _view.errorPrompt('Unable to Submit', 'Sorry, we are unable to submit your form at this moment. Please check your connection or try at a later time.');

                                        });
                          });

              } catch (e) {
                  alert('Error: ' + e.message);
              }// try-catch
          },

          uploadPhoto: function(root, question){
              
              if (question && question.answer.nativeURL) {
                  var source = question.answer.nativeURL,
                      dest = '/' + root + question.answer.localPath,
                      name = question.answer.name || (Date.now() + '.jpg');

                  if (_debug) {
                      alert('Question is ' + JSON.stringify(question));
                      alert('Uploading photo ' + source + ' to ' + dest);
                  }// if
                  
                  return datacontext.image.save(name, source, dest)
                            .then(function (results) {
                                
                                // update question's answer with remote path
                                if (results.success) {
                                    question.answer.remotePath = results.data.remotePath;
                                    
                                    if (_debug) {
                                        alert('Photo remote path is ' + results.data.remotePath);
                                    }// if

                                    return results;

                                } else {
                                    if (_debug) {
                                        alert('Photo save failed for ' + source);
                                    }
                                    return { success: false, message: 'Photo save failed' };
                                }
                            });
              } else {
                  return $q.when({ success: false, message: 'No photo to upload' });
              }// if-else

          },

          uploadPhotos: function() {

              try {

              
                  var uploads = [];
                  var curCard = null;
                  var curQ = null;
                  var photoQuestions = [];
                  var root = $scope.userForm.form.name + '/' + $scope.userForm.identifier;

                  // get all photos
                  for (var i = $scope.userForm.form.cards.length; i--;) {

                      curCard = $scope.userForm.form.cards[i];

                      for (var j = curCard.questions.length; j--;) {

                          curQ = curCard.questions[j];
                          if (curQ.type.key == 'photo' && curQ.answer && curQ.answer.nativeURL && curQ.answer.remotePath == '') {

                              uploads.push(_data.uploadPhoto(root, curQ));
                          }// if

                      }// for

                  }// for
                  
                  return uploads.length > 0 ? $q.all(uploads) : $q.when();

              } catch (e) {

                  supersonic.logger.error(e.toString());

                  alert('Error: ' + e.message);
              }// try-catch

          },

          updateAnswer: function (question, data) {

              var curCard = null;
              
              switch (question.type.key) {

                  case 'photo':

                      curCard = $scope.cards[$scope.currentPosition];

                      // find matching question for photo annotation
                      for (var j = 0; j < curCard.questions.length; j++) {

                          // update answer if question is found
                          if (curCard.questions[j].id == question.id) {

                              $scope.cards[$scope.currentPosition].questions[j].answer = {
                                  name: data.name,
                                  fullPath: data.fullPath,
                                  nativeURL: data.nativeURL,
                                  localPath: '/' + data.name,
                                  remotePath: ''
                              };

                              return;

                          }// if
                      }// for

                      

                      break;

              };// switch

          }
      };

      var _deck = {

          next: function (jumpIndex) {

              var curPos = $scope.currentPosition;
              var nextPos = jumpIndex && jumpIndex > -1 ? jumpIndex : curPos + 1;
              
             _data.setProgressPosition(nextPos);
              $scope.currentPosition = nextPos;
          },

          back: function (jumpIndex) {

              var index = jumpIndex;

              if (jumpIndex === undefined || jumpIndex == null || jumpIndex < 0) {
                  index = $scope.currentPosition - 1;
              }// if
              
              // jump back to previous step if provided, otherwise just go back one
              $scope.currentPosition = index;
              _data.setProgressPosition(index);

          },

          jump: function(jumpIndex){
                            
              if (jumpIndex > -1) {

                  if ($scope.currentPosition > jumpIndex) {
                      _deck.back(jumpIndex);
                  } else {
                      _deck.next(jumpIndex);
                  }// if-else
              }// if

          },

          validateNext: function (curIndex, nextIndex) {

              var deferred = $q.defer();


              // prevent from moving next
              var validation = forms.evaluator.validateCard($scope.cards[curIndex], $scope.cards)
              if (!validation.valid) {

                  $timeout(function () {

                      if (window.device) {
                          // card is incomplete
                          supersonic.ui.dialog.alert(validation.message.title,
                              {
                                  message: validation.message.body,
                                  buttonLabel: 'OK'
                              }).then(function () {
                                  
                                  deferred.reject();
                              });

                      } else {
                          alert(validation.message.body);
                          deferred.reject();
                      }// if-else

                  }, 100);

              } else {

                  // valid - resolve
                  deferred.resolve();

              }// if-else

              return deferred.promise;
          },

          validateBack: function (curIndex, backIndex) {

          }
      };

      /* Scope */
      $scope.type = '';
      $scope.isBusy = true;
      $scope.busyMessage = '';
      $scope.userForm = { form: {} };
      $scope.dependencyList = null;
      $scope.formLength = 0;
      $scope.currentPosition = 0;
      $scope.showReview = false;
      $scope.readOnly = false;
      $scope.disable = false;
      $scope.editMode = 'edit';
      $scope.reviewMode = 'review';
      $scope.sections = [];
      $scope.goingBack = false;
      $scope.prompt = {
          show: false,
          title: '',
          message: '',
          value: '',
          button: 'OK',
          callback: null
      };
      
      $scope.resolveRemoteURL = function (path) {

          var file = datacontext.image.getUrl(path);
          return file;

      };

      $scope.openDrawer = function () {

          supersonic.ui.drawers.open('left');
      };

      $scope.goHome = function () {
          _view.goBack(!$scope.readOnly);
      };
      
      $scope.save = function () {

          $scope.isBusy = true;

          _view.goBack(true)
            .then(function () {

                $scope.isBusy = false;
                
                //supersonic.ui.dialog.alert('Form Submitted', {
                //    message: 'Your form have been succesfully saved',
                //    buttonLabel: 'OK'
                //});
            }, function (e) {
                $scope.isBusy = false;
            });
      };

      $scope.submit = function () {

          $scope.isBusy = true;
          $scope.busyMessage = 'Submitting...';

          _data.submit()
            .then(function (results) {
                $scope.isBusy = false;
                
                supersonic.ui.dialog.alert('Form Submitted', {
                    message: 'Your form has been succesfully submitted',
                    buttonLabel: 'OK'
                }).then(function () {

                    _view.goBack(false);
                });

            }, function (e) {
                $scope.isBusy = false;
                alert('failed to submit ' + JSON.stringify(e));
            });

      };

      $scope.next = function (event) {
          _deck.next();

          event.preventDefault();
          event.stopPropagation();
      };

      $scope.review = function () {

          _deck.validateNext($scope.currentPosition)
            .then(function () {

                
                $scope.showReview = true;

                $scope.sections = forms.data.filterOutline($scope.userForm.outline, $scope.cards);

                
            });
      };

      $scope.hideReview = function () {

          $timeout(function () {
              $scope.showReview = false;
          });
      };

      $scope.getCard = function (card) {

          for (var i = 0; i < $scope.cards.length; i++) {
              if ($scope.cards[i].id == card.id) {
                  return $scope.cards[i];
              }// if
          }// for

      };

      $scope.back = _deck.back;

      $scope.controlAction = function (action, question) {


          try {

              switch (question.type.key) {

                  case 'photo':

                      switch (action) {

                          case 'capture':

                              // launch camera to capture new photo
                              Camera.camera({
                                  quality: 50,
                                  targetWidth: 1440,
                                  targetHeight: 1080,
                                  saveToPhotoAlbum: true
                              }, true)
                                    .then(function (response) {
                                        
                                        //alert(JSON.stringify(response));
                                        if (response && response.length > 0) {
                                            question.answer = {
                                                name: response[0].name,
                                                localPath: response[0].localPath,
                                                nativeURL: response[0].nativeURL,
                                                fullPath: response[0].fullPath,
                                                remotePath: ''
                                            };

                                        }// if

                                    }, function (e) {
                                        supersonic.logger.error('Camera launch error - ' + JSON.stringify(e));
                                    });
                              break;

                          case 'annotate':

                              // get photo's true resolution
                              var image = document.getElementById('photo_' + question.id),
                                  resolution = {
                                      width: image.naturalWidth,
                                      height: image.naturalHeight
                                  };

                              var view = new supersonic.ui.View('view-annotator#annotator');

                              var options = {
                                  params: {
                                      question: JSON.stringify(question),
                                      resolution: JSON.stringify(resolution)
                                  }
                              };
                              
                              supersonic.ui.layers.push(view, options);
                                                            
                              break;

                      };
                      break;
              }; // switch

          } catch (e) {
              supersonic.logger.error('controlAction() Exception - ' + e.toString());
          }
      };
      
      /* Listeners */

      // listen for carousel position changes
      $scope.$watch("currentPosition", function (newValue, oldValue) {

         // alert(newValue);
          document.activeElement.blur();

          //alert(oldValue + ' to ' + newValue);
          if (oldValue < newValue) {
                            
              _deck.validateNext(oldValue, newValue)
                .then(function () {

                    // valid - save previous card data
                    _data.saveCard(oldValue);

                    // update progress position
                    _data.setProgressPosition(newValue);

                    // send position update to drawer
                    writeChannel.send({
                        type: 'positionUpdate',
                        data: {
                            position: newValue,
                            progressCards: $scope.cards
                        }
                    });



                }, function (e) {

                    // not valid
                    _deck.back(oldValue);
                });
             
          } else {

              // save previous card data
              _data.saveCard(oldValue);

              _data.setProgressPosition(newValue);

              // send position update to drawer
              writeChannel.send({
                  type: 'positionUpdate',
                  data: {
                      position: newValue,
                      progressCards: $scope.cards
                  }
              });
          }// if-else


      });

      // listen for view load
      supersonic.ui.views.current.params.onValue(function (params) {

          util.ui.hideNavigationBar();

          if (params.type && localStorage.getItem('loggedIn') === 'true') {
              _view.init(params.type, params.form);
          }// if
      });

      supersonic.ui.views.current.whenVisible(function () {
          app.state.setViewState('form');
      });

      // listen for android back button
      document.addEventListener("backbutton", function () {
          _view.goBack(!$scope.readOnly);
      });

      // listen for message from drawer
      var writeChannel = new util.message.class.Channel('formToProgress');
      var readChannel = new util.message.class.Channel('form_view',
                        function (data) {

                            switch (data.type) {
                                case 'positionSelect':
                                    // position selected from drawer
                                    $scope.$evalAsync(function () {

                                        if ($scope.showReview) {
                                            $scope.hideReview();
                                        }// if

                                        _deck.jump(data.data);
                                    });
                                    break;
                                    
                                case 'annotated':
                                    
                                    $scope.$evalAsync(function () {                                    // get current card in view
                                        _data.updateAnswer(data.question, data.file);
                                    });

                                    break;

                            };// switch

                        });
      
      //// temp for testing
    //_view.init('template', {
    //      "_id": "57d6fc4bc6d8c2a427e8a4c8"
    //});



  }]);

supersonic.ui.navigationBar.update({
    title: '',
    overrideBackButton: true,
    buttons: {
    }
});

