(function() {
  'use strict';

function FormFarmController (
    $scope, $log, $sce, $stateParams, $q,
    SearchService, AdminService
    )
{
    var self = this;
    $log.info("SUBMIT on", $stateParams.id);
    self.load = true;
    self.data = null;
    self.step = $stateParams.step;

    self.loadData = function() {

      self.load = true;

      // Multiple and parallel calls
      var promises = {
        stepNames: SearchService.getSteps(),
        stepTemplates: AdminService.getSteps(self.step),
        data: SearchService.getSingleData($stateParams.id),
      };

      // Use the values
      return $q.all(promises).then(
        (values) =>
        {
            console.log('VALUES', values)
            // $log.debug("Pushed updated order");
            // self.load = false;
            self._all = values;
        });
    }

    self.$onInit = function() {
      self.loadData();
      $log.info("form component", self);
    };

    self.formFields = [
        {
          key: 'emailer',
          type: 'input',
          //type: 'checkbox',
          templateOptions: {
            type: 'text',
            //type: 'email',
            //type: 'password',
            label: 'My address',
            placeholder: 'Enter email'
          }
        },
    ];

    self.submitting = {};
    self.onSubmit = onSubmit;

    // function definition
    function onSubmit() {
      console.log("Submit", JSON.stringify(self.submitting));
    }
}

// A COMPONENT

angular.module('web')
    .component('formfarm', {
      bindings: {
        count: '='
      },
      controller: FormFarmController,
      template: function ($element, $attrs) {
        //console.log('TEMPLATE', $element, $attrs);
        return `
<h3> title </h3>
<md-content layout-padding layout-wrap>
    <form ng-submit="$ctrl.onSubmit()" name="$ctrl.form" novalidate>
        <formly-form model="$ctrl.submitting" fields="$ctrl.formFields">
          <button type="submit" class="btn btn-primary submit-button"
            ng-disabled="$ctrl.form.$invalid">Submit</button>
          <button type="button" class="btn btn-default"
            ng-click="$ctrl.options.resetModel()">Reset</button>
        </formly-form>
    </form>
</md-content>
`;
      }

    });

})();