(function() {
  'use strict';
angular.module('web').service('auth', authService)
.controller('LoginController', LoginController)
;

//////////////////////////////
function LoginController($scope, $log, auth) {

    $log.debug("Login Controller");
    var token = "WyIxIiwiODFmMjFhNWVkMTA4MjY0ZDk1ZjJmZDFiZTlhZWVjMDYiXQ.CVgRvg.UQqt6SGH6Hd5nyPaLl1rNYOCCVw" // + "BB"

    auth.login(token).then(function logged(some){
        console.log("Token in storage is:", auth.getToken());
    });

    $scope.loginfun = function() {
        $log.debug("TEST");
    }

}

///////////////////////////////////////////
// https://thinkster.io/angularjs-jwt-auth
///////////////////////////////////////////
function authService($window, $http) {
  var self = this;
// Add JWT methods here

    self.saveToken = function(token) {
      $window.localStorage['jwtToken'] = token;
      return token;
    }
    self.getToken = function() {
      return $window.localStorage['jwtToken'];
    }

    self.login = function(token) {
        var req = {
            method: 'GET',
            url: 'http://awesome.dev:8081' + '/' + 'api/checklogged',
            headers: {
            "Authentication-Token" : token
            //   'Content-Type': undefined
            },
            //data: { test: 'test' }
        }

        return $http(req).then(
            function successCallback(response) {
                console.log("OK");
                console.log(response);
                return self.saveToken(token);
          }, function errorCallback(response) {
                console.log("FAILED TO LOG");
                console.log(response);
                return self.saveToken(null);
        });
    }
}

})();