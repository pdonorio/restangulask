(function() {
  'use strict';

///////////////////////////////////////////
///////////////////////////////////////////
/********************/
angular
    .module('web')
    .controller('MenuInAppController', MenuInAppController)
    .controller('FabButtonController', FabController);

function MenuInAppController($scope, $rootScope, $log, $auth, $state)
{
    $log.info("Force a new menu");
    var self = this;

    // Where am i?
    self.currentPage = $state.current.name;

    // Remove normal/main menu
    $rootScope.menu = [];

    // Let the controller know if logged
    self.logged = $auth.isAuthenticated();

    if (self.logged) {
        self.buttons = [
            //{ name: 'submit', link: 'logged.submission', icon: null, },
            { name: 'manage', link: 'logged.admin', icon: null, },
            { name: 'fix', link: 'logged.explore', icon: null, },
            { name: 'logout', link: 'logged.logout', icon: null, },
        ];
    } else {
        self.buttons = [
            { name: 'login', link: 'login', icon: null, },
        ];
    }
}

//https://material.angularjs.org/latest/demo/fabSpeedDial
function FabController($scope, $log, $timeout)
{
    var self = this;
    $log.info("Fab");

    self.isOpen = false;
    self.tooltipVisible = false;
    self.availableModes = ['md-fling', 'md-scale'];
    self.selectedMode = 'md-scale';
    self.hover = false;

    self.items = [
        { name: "Twitter", icon: "twitter", direction: "bottom" },
        { name: "Facebook", icon: "facebook", direction: "top" },
        { name: "Google Hangout", icon: "hangout", direction: "bottom" }
    ];

      // On opening, add a delayed property which shows tooltips after the speed dial has opened
      // so that they have the proper position; if closing, immediately hide the tooltips
      $scope.$watch('demo.isOpen', function(isOpen) {
        if (isOpen) {
          $timeout(function() {
            $scope.tooltipVisible = self.isOpen;
          }, 600);
        } else {
          $scope.tooltipVisible = self.isOpen;
        }
      });
}

})();