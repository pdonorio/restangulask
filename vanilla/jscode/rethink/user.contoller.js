(function() {
  'use strict';

angular.module('web')
    .controller('UserManagerController', UserManagerController)

function UserManagerController($scope, $log, AdminService)
{
    var self = this;
    $log.info("UM");

    AdminService.listUsers().then(function(out) {
        if (out) {
            console.log("Uhm", out);
        }
    });
}

})();