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

/*

// TOFIX

Handle 'draft' state for creating a new record

1. fab button?
2. if 'draft' on load:
    do not load existing data and fill
3. if 'draft' on save:
    create a new id (empty element in 'datavalues')
        separated with POST?
    save step as usual
    redirect submission to element
    ... then it's a normal update

*/


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

        self.main = self._all['data'][0]["Numero de l'extrait"];
        self.current = angular.copy(self._all['data'][self.step-1]);

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
          var choose = getType(element.type);
          self.hashes[element.position] = element.hash;

          // TEXTAREA
          var field = {
              key: element.field, //key: element.hash,
              type: 'textarea', //type: 'input',
              templateOptions: {
                type: 'text',
                label: element.field, //placeholder: 'Enter email'
                rows: 2,
                cols: 80,
                // grow: true,
              },
          };

          // LIST / select
          if (choose == "list") {
            var options = [
                {"value": "", "name": "-"}
            ];
            forEach(element.extra.split(','), function (obj, pos) {
                options.push({"value":obj, "name": obj});
            });
            field = {
                key: element.field,
                type:'select',
                defaultValue: options[0],
                templateOptions: {
                    label: element.field,
                    options: options,
                    // labelProp: 'name',
                    // valueProp: 'name',
                },
            }
          }

          if (element.required) {
            field.validation = {"show": true};
          }

          self.formFields[element.position-1] = field;

// TOFIX
    // other types
    // string (textarea), list (select), date, url

/*

{
  type: "datepicker",
  key: "start",
  templateOptions: {
    theme: "custom",
    placeholder: "Start date",
    minDate: minDate, // instance of Date
    maxDate: maxDate, // instance of Date
    filterDate: function(date) {
        // only weekends
        var day = date.getDay();
        return day === 0 || day === 6;
    }
  }
}

   formlyConfigProvider.setType({
      name: 'url',
      extends: 'input',
      defaultOptions: {
        templateOptions: {
            type: 'url'
        }
      }
    });


*/
        });
    }

    self.loadData = function() {

      self.load = true;
      // Multiple and parallel calls
      var promises = {
        data: SearchService.getDataToEdit($stateParams.id),
        //data: SearchService.getSingleData($stateParams.id, true),
        stepNames: SearchService.getSteps(),
        stepTemplates: AdminService.getSteps(self.step)
      }

      // Use the values
      return $q.all(promises).then(
        (values) =>
        {
            forEach(values, function(element, index) {
                self._all[index] = angular.copy(element);
            });
            //self._all = angular.copy(values);
            $log.info("Updated values", self._all);
            self.fillFields();
            self.load = false;
        });
    }

    self.onSubmit = function (argument) {
      console.log("Submit", JSON.stringify(self.current));
      return false;
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
            value: self.current[element.key] || '',
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
          }, 2500);

      });

    };

    self.$onInit = function() {
      self.templateDir = templateDir;
      self.message = null;
      self._all = {};
      self.loadData();
    };
}

// A COMPONENT

angular.module('web')
    .component('formfarm', {
      //require: { parent: '^^parentComponent' },
      // transclude: true,
      // bindings: {
      //   root: '&'
      // },
      controller: FormFarmController,
      templateUrl: blueprintTemplateDir + 'submission.html',

    });

})();