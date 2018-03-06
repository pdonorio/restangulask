(function() {
  'use strict';

angular.module('web')
    .controller('UserManagerController', UserManagerController)
    .controller('LexiqueController', LexiqueController)
    .controller('FieldsController', FieldsController);

function FieldsController($scope, $log, $interval, AdminService)
{
    var self = this;
    $log.info("fields");

    self.load = function() {

        self.fields = { // init
            1: [], 2: [], 3: [], 4: [],
            5: [],
        };

        AdminService.getSteps().then(function (out) {
          if (out) {
            forEach(out.data, function(element) {
              if (element.extra) {
                // console.log(element);
                element.input = null;
                element.select = null;
                // element.options = element.extra.split(',');
                element.options = element.extra;
                self.fields[element.step].push(element);
              }
            });
          }
        });
    };
    self.load();

    self.addElement = function(step, field, value) {
        // console.log("test", step, field, value);
        $scope.showSimpleToast({'Added': value});
        AdminService.updateStep(step, field, value).then(function(out) {
            if (out)
                self.load();
        });
    };

    self.removeElements = function(step, field, value) {
        // console.log("test", step, field, value);

        var newvalue = '';
        forEach(value, function(element) {
            newvalue += element.trim() + ',';
            $scope.showSimpleToast({'Removed': element});
        });
        AdminService.updateStep(step, field, newvalue, true)
        .then(function(out) {
            if (out)
                self.load();
        });
};
}

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
