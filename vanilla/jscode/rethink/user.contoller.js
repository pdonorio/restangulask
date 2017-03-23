(function() {
  'use strict';

angular.module('web')
    .controller('UserManagerController', UserManagerController)

function UserManagerController($scope, $log, AdminService)
{
    var self = this;
    $log.debug("UM");

    AdminService.listUsers().then(function(out) {
        if (out) {
            console.log("DATA", out);
            self.users = out.data;
        }
    });
}

})();