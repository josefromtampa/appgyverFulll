angular
  .module('example')
  .controller('SettingsController', function($scope, supersonic) {
      $scope.navbarTitle = "Settings";

      var modalView = new supersonic.ui.View("view-login#login");
      var options = {
          animate: true
      }

      supersonic.ui.modal.show(modalView, options);
  });
