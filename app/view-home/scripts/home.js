angular
  .module('view-home')
  .controller('HomeController', function ($q, $scope, $timeout, $interval, supersonic, datacontext, util, app) {


      /* Helers */
      var hidden = false;
      
      // view helpers
      var _view = {

          // initalize view
          init: function () {

              try {
                  $scope.isBusy = true;
                  var user = app.session.getUser();
                  $scope.userEmail = user ? user.email || user.username : '';

                  $scope.showSettings = false;
                  $scope.showSearch = false;
              
                  // get templates
                  $q.all([_data.refreshTemplates(), _data.refreshUserForms()])
                      .then(function (results) {

                          $scope.isBusy = false;

                      });

              } catch (e) {

                  supersonic.logger.error('Unable to initialize dashboard - ' + e.message);


              }// try-catch


          },

          // de-initialize view
          reset: function () {

              $scope.userEmail = '';
              $scope.showSettings = false;
              $scope.showSearch = false;
              $scope.templates = [];
              $scope.myForms = [];
              $scope.viewIdx = 0;
              $scope.isBusy = true;
          },

          setLogout: function () {

              // clear data
              app.state.setLoggedOut();
              util.message.broadcastAppEvent('logout');
              _view.reset();

              localStorage.clear();
              // pop to login
              app.view.showLogin(false);
          }

      };

      var _data = {

          removeFormFromScope: function (id) {
                            
              try {

                  // remove form from scope
                  _.remove($scope.myForms, function (ele) {
                      return ele._id == id;
                  });

              } catch (e) {
                  supersonic.logger.error(e.toString());
              }// try-catch
          },

          refreshTemplates: function () {
              return datacontext.forms.getTemplates()
                         .then(function (results) {

                             if (results.success) {
                                 //supersonic.logger.info('got templates ' + JSON.stringify(results.data));

                                 $scope.templates = results.data;

                                 // TODO: cache locally also

                             }// if

                             return $q.when(results);

                         }, function (e) {

                             // if error, then try to get from local cache

                             return e;

                         });
          },

          refreshUserForms: function () {

              return datacontext.forms.getList()
                            .then(function (results) {

                                if (results.success) {
                                    //supersonic.logger.info('got forms ' + JSON.stringify(results.data));

                                    $scope.myForms = results.data;

                                    // TODO: cache locally also

                                } // if

                                return $q.when(results);

                            }, function (e) {

                                // if error, then try to get from local cache
                                return e;
                            });
          }
      };
            
      /* Scope */
      $scope.filter = '';
      $scope.userEmail = '';
      $scope.showSettings = false;
      $scope.showSearch = false;
      $scope.templates = [];
      $scope.myForms = [];
      $scope.viewIdx = 0;
      $scope.isBusy = true;
      $scope.showDelete = false;

      /* Scope Methods */
      $scope.filterSaves = function (form) {
          var filter = $scope.filter.toLowerCase();
          return form.status.key == 'saved'
                    && (form.name.toLowerCase().indexOf(filter) > -1 ||
                    form.identifier.toLowerCase().indexOf(filter) > -1);
      };

      $scope.filterSubmitted = function (form) {
          var filter = $scope.filter.toLowerCase();
          return form.status.key == 'submitted'
                    && (form.name.toLowerCase().indexOf(filter) > -1 ||
                    form.identifier.toLowerCase().indexOf(filter) > -1);
      };

      $scope.logOut = function () {
                    
          try {
              datacontext.auth.logout()
                .then(function () {

                });
                _view.setLogout();

          } catch (e) {
              supersonic.logger.error('Home.logOut() Exception - ' + e.toString());
          }// try-catch
      };

      $scope.openForm = function (type, form) {
          
          // open form and pass type and form data
          util.ui.findViewAndOpen('form', { type: type, form: form });

      };

      $scope.deleteForm = function (userForm) {
          try {

              var options = {
                  message: 'Are you sure you want to delete this form?',
                  buttonLabels: ['Yes', 'No']
              };

              if (window.device) {
                  supersonic.ui.dialog.confirm('Confirm Delete', options)
                    .then(function (index) {

                        if (index == 0) {

                            // delete form
                            datacontext.forms.delete(userForm._id);

                            $scope.$evalAsync(function () {
                                // remove from scope
                                _data.removeFormFromScope(userForm._id);
                            });
                            
                        }// if
                    });

              } else {
                  // not on device - just remove
                  _data.removeFormFromScope(userForm._id);
                  
              }// if-else
          } catch (e) {
              alert(e.message);
              supersonic.logger.error('home.js deleteForm() Exception - ' + e.message);
          }// try-catch
      };


      /* Listeners */
      supersonic.ui.views.current.whenVisible(function () {

          if (!hidden) {
              util.ui.hideNavigationBar();
          }// if

          hidden = true;
          
          app.state.setViewState('home');

      });

      util.message.registerAppListener(function (type, data) {

          switch (type) {
              case 'login':

                  $scope.$evalAsync(function () {
                      _view.init();
                  });
                  break;

              case 'form_submitted':
              case 'form_saved':
                  _data.refreshUserForms();
                  break;

              case 'session_expired':

                  $timeout(function () {

                      try {
                          
                        // pop all layers
                        supersonic.ui.layers.popAll();

                        //supersonic.ui.dialog.alert('Session Expired', {
                        //    message: 'Your login session has expired, please login again.',
                        //    buttonLabel: 'OK'
                        //}).then(function () {

                            _view.setLogout();
                        //});

                      } catch (e) {

                          app.state.setLoggedOut();
                          _view.reset();
                          supersonic.logger.error('Exception handling session_expired - ' + e.toString());
                      }// try-catch

                  }, 2500);
                  break;
          };
      });

      /* Main */
        // get logged in status
      var loggedIn = localStorage.getItem('loggedIn');

      supersonic.device.platform()
        .then(function (platform) {
            localStorage.setItem('platform', JSON.stringify(platform));

            // wierd timing issue with iOS splash so it needs more delay
            var timeout = 500;
            if (platform.name == 'iOS') {
                timeout = 3000;
            }// if
            if (loggedIn == null || loggedIn != 'true') {
                $timeout(function () {
                    app.view.showLogin(true);
                }, timeout);
            } else {
                _view.init();
            }// if-else
        });

      steroids.on('ready', function () {
          localStorage.setItem('absoluteUserFilesPath', steroids.app.absoluteUserFilesPath);

      });
            
      window.onload = function () {
          Hammer.defaults.touchAction = 'auto';
          WebPullToRefresh.init({
              loadingFunction: function () {
                  
                  if ($scope.viewIdx == 0) {
                      return _data.refreshTemplates()
                  } else {
                      return _data.refreshUserForms();
                  }

              },
              contentEl: document.getElementById('form-content'),
              ptrEl: document.getElementById('form-progress'),
              onPanStart: function () {

                  // only allow panning if card scroll is at top
                  var curCard = document.getElementById('card' + $scope.viewIdx);
                  return curCard.scrollTop == 0;
              }
          });

      };

  });

