(function() {
  'use strict';

function getType(key) {

  var types = [
      {value: 0, text: 'string', desc:
          'All text is allowed'},
      {value: 1, text: 'number', desc:
          'Only integers values'},
      {value: 2, text: 'email', desc:
          'Only e-mail address (e.g. name@mailserver.org)'},
      {value: 3, text: 'url', desc:
          'Only web URL (e.g. http://website.com)'},
      {value: 4, text: 'date', desc:
          'Choose a day from a calendar'},
      {value: 5, text: 'time', desc:
          'Choose hour and minutes'},
      {value: 6, text: 'pattern', desc:
          'Define a regular expression for a custom type'},
      {value: 7, text: 'color', desc:
          'Only colors in hexadecimal value. Choose from color picker.'},
      {value: 8, text: 'list', desc:
          'Define a list of possible values (e.g. a dictionary)'},
  ];
  // save type to be sure in the future?
  var type = types[0].text;
  if (types[key])
      type = types[key].text;
  return type;
}

function FormFarmController (
    $scope, $log, $sce, $state, $stateParams, $q, $window, $timeout,
    SearchService, AdminService
    )
{
    var self = this;
    $log.info("SUBMIT on", $stateParams.id);

    self.step = 1;
    self.current = {};
    self.formFields = [];
    self.hashes = {};
    if ($stateParams.step)
        self.step = $stateParams.step;

    self.go = function (step) {
        $state.go("logged.submit", {id: $stateParams.id, step: step});
    }

    self.fillFields = function () {
        var key = self._all['stepNames'][self.step];
        //var data = self._all['data'][key];
        self.current = self._all['data'][key];
        //console.log('TEST', self.current);
        var current = self._all['stepTemplates'].data;

        for (var i = 0; i < current.length; i++) {
            self.formFields[i] = {
                name: '' + i,
                template: '',
                extras: { skipNgModelAttrsManipulator: true }
            };
        }

        forEach(current, function(element, index) {
          //console.log('POS', element.position, element, getType(element.type));
          self.hashes[element.position] = element.hash;
// TOFIX

    // Base is Textarea
    // Integer
    // Select
    // Date

          self.formFields[element.position-1] =
              {
                  key: element.field, //key: element.hash,
                  type: 'input',
                  templateOptions: {
                    type: 'text',
                    label: element.field, //placeholder: 'Enter email'
                  },
              };
        });
    }

    self.loadData = function() {

      // Multiple and parallel calls
      var promises = {
        stepNames: SearchService.getSteps(),
        stepTemplates: AdminService.getSteps(self.step),
        data: SearchService.getSingleData($stateParams.id, true),
      };

      // Use the values
      return $q.all(promises).then(
        (values) =>
        {
            self._all = angular.copy(values);
            $log.info("Obtained values", values);
            self.fillFields();
        });
    }

    self.onSubmit = function (argument) {
      console.log("Submit", JSON.stringify(self.current));
      var toSubmit = {
        step: self.step,
        data: [],
      }
      forEach(self.formFields, function (element, index) {
        //console.log("data is", index, self.current[element.key]);
        toSubmit.data.push({
            position: index + 1,
            hash: self.hashes[index],
            name: element.key,
            value: self.current[element.key],
        });

      });

      AdminService.updateDocument($stateParams.id, toSubmit)
        .then(function (out) {
          console.log('updated', toSubmit, out);

          // show toast
          $window.scrollTo(0, 0);
          self.message =
            "Updating step " + self.step + " content " +
            "before moving to next...";

          // compute next step
          var newstep = parseInt(self.step) + 1;
          //console.log('STEP', self.step, self._all['stepNames'].length, newstep);
          if (newstep > self._all['stepNames'].length-1)
            newstep = 1;

          // go to next step
          $timeout(function () {
            self.message = null;
            console.log('Cleaning');
            self.go(newstep);
          }, 3500);

      });

    };

    self.$onInit = function() {
      self.message = null;
      self.loadData();
      console.log('TESTING SCOPE', $scope);
      //console.log('PARENT', self.parent);
    };
}

// A COMPONENT

angular.module('web')
    .component('formfarm', {
      //require: { parent: '^^parentComponent' },
      // transclude: true,
      // bindings: {
      //   toast: '='
      // },
      controller: FormFarmController,
      templateUrl: blueprintTemplateDir + 'submission.html',

    });

})();