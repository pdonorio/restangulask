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

    self.draft = ($stateParams.id == 'draft');
/*

Handle 'draft' state for creating a new record

1. add button in topbar menu
2. if 'draft' on load:
    do not load existing data and fill
3. if 'draft' on save:
    create a new id (empty element in 'datavalues')
        separated with POST?
    save step as usual
    redirect submission to element
    ... then it's a normal update

*/


    self.go = function (step) {
        $state.go("logged.submit", {id: $stateParams.id, step: step});
    };

    function compare(a, b) {
        return a.value.localeCompare(b.value);
    }

    self.fillFields = function () {

        if (!self.draft) {
            // console.log('ALL IS', self._all['data']);

            if ( self._all['data'][0] &&
                self._all['data'][0].hasOwnProperty("Numero de l'extrait"))
            {
                self.main = self._all['data'][0]["Numero de l'extrait"];
            }
            // console.log("TEST PAOLO", self._all['data'][self.step-1]);
            self.current = angular.copy(self._all['data'][self.step-1]);
        }

        var current = self._all['stepTemplates'].data;
        // self.current.multiselect = {}
        // console.log('PAOLO', self.current);

        for (var i = 0; i < current.length; i++) {
            self.formFields[i] = {
                name: '' + i,
                template: '',
                extras: { skipNgModelAttrsManipulator: true }
            };
        }

        console.log('current', self.current);

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

            // console.log("List", element.field);
            var options = [];
            if (self.step != 4)
                options.push({"value": "", "name": "-"});

            // console.log("TEST", element.extra);
            forEach(element.extra, function (obj, pos) {
            // forEach(element.extra.split(','), function (obj, pos) {
                options.push({"value":obj.trim(), "name": obj});
            });
            options.sort(compare);
            // console.log("SELECT", options);

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
            };

            // Details MULTISELECT
            if (self.step == 4) {
                field.templateOptions.multiple = true;
                //field.modelOptions = {allowInvalid: true};
                // field.validators = {
                //   justatest: {
                //     expression: function(viewValue, modelValue) {
                //         console.log('Validate', viewValue, modelValue);
                //         var value = modelValue || viewValue;
                //         return true;
                //     },
                //     message: '$viewValue + " is not valid"'
                //   }
                // };
                if (typeof(self.current[element.field]) == "string") {
                    self.current[element.field] = [
                        //" " +
                        self.current[element.field]
                    ];
                } else {
                    self.current[element.field] = [];
                }
                var newarray = [];
                if (self.current[element.field]) {
                    forEach(self.current[element.field], function(element, index) {
                        newarray.push(element.trim());
                    });
                    self.current[element.field] = angular.copy(newarray);
                    // console.log("MULTI 2", self.current[element.field]);
                }
            }

          } else if (choose == 'date') {
            // update the element to parse the date
            if (self.current[element.field]) {
                self.current[element.field] = new Date(self.current[element.field]);
            } else {
                // empty value for datepicker
                self.current[element.field] = null;
            }
            //console.log("DATE", self.current[element.field], element.required);

            field = {
                key: element.field,
                type: "datepicker",
                templateOptions: {
                  label: element.field,
                  // theme: "custom",
                  // disabled: true,
                  //placeholder: element.field,
                  // minDate: null,
                  // maxDate: null,
                  // minDate: new Date(Date.parse("1600")),
                  // maxDate: new Date(Date.parse("1700")),
                  // datepickerOptions: {
                  //     "format": "DD-mm-yyyy"
                  // },
                }
            };
          }

          if (element.required) {
            //console.log('TEST required', element);
            field.validation = {"show": true};
          }

          self.formFields[element.position-1] = field;

        });

    };

    self.fillSource = function() {
        // console.log("SOURCE", self.source, self._all.sources[self.source]);
        self.current = angular.copy(self._all.sources[self.source]);
    };

    self.fillParty = function() {
        // console.log("Fete", self.fete); //, self._all.sources[self.source]);
        self.current = angular.copy(self._all.parties[self.fete]);
    };

    self.loadData = function() {

      self.load = true;
      // Multiple and parallel calls
      var promises = {
        data: SearchService.getDataToEdit($stateParams.id),
        //data: SearchService.getSingleData($stateParams.id, true),
        stepNames: SearchService.getSteps(),
        stepTemplates: AdminService.getSteps(self.step),
        // sources: SearchService.getSourcesData(),
      };

      if (self.step == 2) {
          promises.sources = SearchService.getSourcesData();
      }

      if (self.step == 3) {
          promises.parties = SearchService.getPartiesData();
      }

      // do not load existing data if this is just a draft
      if (self.draft) {
        delete promises.data;
      }

      // Use the values
      return $q.all(promises).then(
        (values) =>
        {
            forEach(values, function(element, index) {
                self._all[index] = angular.copy(element);
            });
            //self._all = angular.copy(values);
            $log.info("Updated values", self._all, self.current);
            self.fillFields();
            // console.log('TEST', self.formFields);
            self.load = false;
        });
    };

    self.onSubmit = function (argument) {
      var toSubmit = {
        step: parseInt(self.step),
        data: [],
      };

      forEach(self.formFields, function (element, index) {
        // console.log("data is", index, self.current[element.key]);
        if (self.current[element.key]) {

            var pos = index + 1;
            if (!self.hashes[pos]) {
              $log.error("Failed to get hash", pos, self.hashes);
            } else {
                // note: this happens if element.type == 'select'
                // and no data is there
                var tmp = {
                  position: index + 1,
                  hash: self.hashes[index + 1],
                  name: element.key,
                };

                if (!self.current[element.key].hasOwnProperty('value')) {
                  tmp.value = self.current[element.key] || '';
                }
                /*
                else if (self.step == 4) {
                  var val = angular.copy(self.current.multiselect[element.key]);
                  if (val.length > 0 && val[0] != '')
                    tmp.values = val;
                }
                */

                if (tmp.hasOwnProperty('value') || tmp.hasOwnProperty('values'))
                    toSubmit.data.push(tmp);
            }

        }

      });
      // console.log("Submit", JSON.stringify(self.current));
      // console.log("translated to", toSubmit);
      // return false;

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

            // if draft, this is the first step we are introducing
            if (self.draft) {
                // THE MAGIC
                $state.go('.', {id: out, step: newstep}, {notify: false});
                self.step = newstep;
                self.current = {};
                self.loadData();
            } else {
                self.go(newstep);
            }

          }, 2500);

      });

    };

    self.$onInit = function() {
      self.templateDir = templateDir;
      self.message = null;
      self._all = {};
      self.myid = $stateParams.id;
      self.step = 1;
      self.current = {};
      self.formFields = [];
      self.hashes = {};
      if ($stateParams.step)
          self.step = $stateParams.step;
      self.loadData();
    };
}


///////////////////////////////////////////////////////
function MultipleFields (formlyConfigProvider)
{
    // set templates here
    formlyConfigProvider.setType({
      name: 'multiselect',
      templateUrl: blueprintTemplateDir + 'multiselect.html',
      wrapper: ['label', 'messages', 'inputContainer'],
      // template: '<h3> PROVA </h3>',
    });
}

///////////////////////////////////////////////////////

// A COMPONENT

angular.module('web')
    .config(MultipleFields)
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
