angular
  .module('drawer-progress')
  .controller('ProgressController', function ($timeout, $scope, supersonic, util, forms) {

      /* Helpers */
      var writeChannel = new util.message.class.Channel('form_view');
      var readChannel = new util.message.class.Channel('formToProgress',
          function (message) {

              try {
                
                  switch (message.type) {

                      case 'init':
                          if (message.data) {

                              $scope.$evalAsync(function () {
                                  // update form index                            
                                  $scope.userForm = message.data.userForm;

                                  if (message.data.progressCards) {
                                      $scope.sections = forms.data.filterOutline($scope.userForm.outline, message.data.progressCards);
                                  }// if

                                  $timeout(function () {
                                      $scope.position = message.data.progress.currentPosition;
                                      $scope.progress = message.data.progress.progressPosition;
                                  });

                              });
                          }// if
                          break;

                      case 'positionUpdate':

                          try {
                              $scope.$evalAsync(function () {
                                  $scope.position = message.data.position;

                                    if (message.data.progressCards) {
                                        $scope.sections = forms.data.filterOutline($scope.userForm.outline, message.data.progressCards);
                                    }// if
                                
                              });
                          } catch (e) {

                          }
                          break;

                      case 'progressUpdate':
                          $scope.$evalAsync(function () {
                              $scope.progress = message.data.progress;

                          });
                          break;

                  };// switch

              } catch (e) {
                  supersonic.logger.error('progress.js Exception parsing message - ' + e.message);
                  alert(e.message);
              }// try-catch
          });

      /* Scope */
      $scope.userForm = {};
      $scope.position = 0;
      $scope.progress = 1;
      $scope.sections = [];

      $scope.setPosition = function (card) {

          $scope.position = card.index;

          supersonic.ui.drawers.close();
          writeChannel.send({
              type: 'positionSelect',
              data: card.index
          });
      };

      $scope.showSection = function (section) {

          var show = false;

          for (var i = 0; i < section.cards.length; i++) {
              if (section.cards[i].index <= $scope.progress) {
                  return true;
              }
          }// for

          return show;

      }

      /* Listeners */




  });
