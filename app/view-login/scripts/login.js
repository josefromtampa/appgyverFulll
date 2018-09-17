angular
  .module('view-login')
  .controller('LoginController', function ($window, $scope, $timeout, supersonic, datacontext, app, util) {
     

      try {


          /* Helpers */
          var navHidden = false;

          var _view = {

              clear: function () {
                  $scope.user.username = '';
                  $scope.user.password = '';

                  _view.clearError();

                  $scope.isBusy = false;
              },

              clearError: function () {
                  $scope.errors.username = false;
                  $scope.errors.password = false;
                  $scope.error = '';
              },

              setState: function (data, error) {

                  if (!error) {
                      _view.clear();
                      datacontext.log.logEvent('login', data);
                  } else {
                      $scope.error = error;

                      datacontext.log.logEvent('error-login', error);

                  }// if-else

                  $scope.isBusy = false;

              }
          };


          /* Scope */
          $scope.user = {
              username: '',
              password: ''
          };
          $scope.errors = {
              username: false,
              password: false
          };
          $scope.isBusy = false;
          $scope.error = '';
          $scope.year = (new Date()).getFullYear();

          /* Scope Methods */
          $scope.login = function () {

              try {

                  _view.clearError();

                  if ($scope.user.username == '' || $scope.user.password == '') {

                      $scope.errors.username = $scope.user.username.trim() == '';
                      $scope.errors.password = $scope.user.password.trim() == '';
                  
                      $scope.error = 'Username and password is required';

                      return;
                  }// if

                  datacontext.auth.login($scope.user.username, $scope.user.password)
                    .then(function (results) {
                    
                        // cache user session
                        app.state.setLoggedIn(results);
                    
                        //supersonic.logger.info(JSON.stringify(results));
                    
                        _view.setState(results);
                        util.message.broadcastAppEvent('login', results);

                        // pop login view
                        supersonic.ui.modal.hide();

                    }, function (e) {
                    
                        $scope.$evalAsync(function () {
                            $scope.user.password = '';
                        });
                        supersonic.logger.error('login.js datacontext.login() Login failed - ' + e);
                        _view.setState(false, e);

                    });

              } catch (e) {

                  supersonic.logger.error('login.js login() Exception - ' + e.message);
                  _view.setState(false, 'Login errored');

              }// try-catch

          }
    

          supersonic.ui.views.current.whenVisible(function () {
          
              app.state.setViewState('login');
              
              if (!navHidden) {
                  util.ui.hideNavigationBar();
                  navHidden = true;
              }// if
          });


          document.addEventListener("backbutton", function () {
              // disable android back button on this page - do nothing
          });


      } catch (e) {

          alert(e.message);
      }

  });

