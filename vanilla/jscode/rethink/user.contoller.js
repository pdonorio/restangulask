(function() {
  'use strict';

angular.module('web')
    .controller('UserManagerController', UserManagerController)
    .controller('LexiqueController', LexiqueController);

function LexiqueController($scope, $log, $interval, AdminService)
{
    var self = this;
    $log.debug("lex");
    console.log("test");

    self.checkLexique = function() {
        AdminService.checkLexique().then(function(out) {
            if (out) {
                console.log("DATA", out);
                self.status = out;
                // self.users = out.data;
            }
        });
    };

    $interval(function(){
        console.log("Interval");
        self.checkLexique();
    }, 6000);
    // init first time
    self.checkLexique();

    self.launchLexique = function() {
        console.log("Lexique request");
        AdminService.launchLexique().then(function(out) {
            console.log("Launched:", out);
            self.checkLexique();
        });
    };
}

function UserManagerController($scope, $log, AdminService)
{
    var self = this;
    // $log.debug("UM");

    AdminService.listUsers().then(function(out) {
        if (out) {
            console.log("DATA", out);
            self.users = out.data;
        }
    });
}

})();
