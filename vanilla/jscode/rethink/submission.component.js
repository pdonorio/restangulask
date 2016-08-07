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
    $scope, $log, $sce, $state, $stateParams, $q,
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

/*

- HTTP API new GET : Recover from 'datavalues' with no modifications
- add missing positions to input data
- draw formatter for returning element.value
- self.current = that data
- draw parser for writing element.value
- save self.current as it is with PUT


    // UFF
    function myParser(value) {
        console.log('Parser', value);
        return (value || '');
    }
    function myFormatter(value) {
        console.log('Formatter', value);
        return (value || '');
    }

*/
    self.fillFields = function () {
        var key = self._all['stepNames'][self.step];
        //var data = self._all['data'][key];
        self.current = self._all['data'][key];
        //console.log('TEST', self.current);
        var current = self._all['stepTemplates'].data;

        for (var i = 0; i < current.length; i++) {
            self.formFields[i] = {};
        }

        forEach(current, function(element, index) {
          //console.log('POS', element.position, element, getType(element.type));
          self.hashes[element.position] = element.hash;
          self.formFields[element.position-1] =
              {
                  key: element.field, //key: element.hash,
                  type: 'input',
                  templateOptions: {
                    type: 'text',
                    label: element.field, //placeholder: 'Enter email'
                  },
                  //parsers: [myParser], //formatters: [myFormatter],
              };
        });

        console.log("Hashes", self.hashes);

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

    self.onSubmit = onSubmit;

    // function definition
    function onSubmit() {
      console.log("Submit", JSON.stringify(self.current));
// TO FIX:
// To convert AND save inside APIs
    }

    self.$onInit = function() {
      self.loadData();
    };
}

// A COMPONENT

angular.module('web')
    .component('formfarm', {
      bindings: {
        count: '='
      },
      controller: FormFarmController,
      templateUrl: blueprintTemplateDir + 'submission.html',

    });

})();