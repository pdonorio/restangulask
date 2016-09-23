(function() {
  'use strict';

angular.module('web').controller('FormDialogController', FormDialogController);
angular.module('web').controller('FormlyDialogController', FormlyDialogController);
angular.module('web').controller('SchemaFormDialogController', SchemaFormDialogController);
angular.module('web').service('FormDialogService', FormDialogService);

function FormlyDialogController($scope, $controller, FormlyService, noty) {
    $controller('FormDialogController', {$scope: $scope});

  $scope.createForm = function(promise, form_data, DataController) {
    promise.then(
      function(out_data) {
        var data = FormlyService.json2Form(out_data.data, form_data, DataController)

        $scope.fields = data.fields;
        $scope.model = data.model;
        noty.extractErrors(out_data, noty.WARNING);
      },
      function(out_data) {
        noty.extractErrors(out_data, noty.ERROR);
      }
    );
  }

}

function SchemaFormDialogController($scope, $controller, SchemaFormService, noty) {
    $controller('FormDialogController', {$scope: $scope});

  $scope.createForm = function(promise, form_data, DataController) {
    promise.then(
      function(out_data) {
        var data = SchemaFormService.json2Form(out_data.data, form_data, $scope.buttonText)

        $scope.fields = data.fields;
        $scope.form = data.form;
        $scope.model = data.model;
        noty.extractErrors(out_data, noty.WARNING);
      },
      function(out_data) {
        noty.extractErrors(out_data, noty.ERROR);
      }
    );
  }
}

function FormDialogController($scope, noty) {

  var self = this;

  // Defautl values
  $scope.dialogTitle = 'Undefined title';
  $scope.buttonText = 'Submit'


  $scope.formIsValid = function() {

    // $scope.$broadcast('schemaFormValidate');
    //if (form.$valid) {

    return true;

  }
  $scope.closeDialog = function(promise) {

    promise.then(
      function(out_data) {
        $scope.answer(out_data.data);
        noty.extractErrors(out_data, noty.WARNING);
      },
      function(out_data) {
        noty.extractErrors(out_data, noty.ERROR);
      }
    );

    return true
  }

  // $scope.hide = function() {
  //   $uibModal.hide();
  // };
  $scope.initParent = function(modal) {
    $scope.cancel = function() {
      modal.dismiss();
    };
    $scope.answer = function(answer) {
      modal.close(answer);
    };
  }

}

function FormDialogService($log, $uibModal, $rootScope) {
  var self = this;

  self.showFormlyDialog = function(form_data, dataCtrl) {
    var scope = $rootScope.$new()
    scope.form_data = form_data
    return $uibModal.open({
        controller: dataCtrl,
        templateUrl: templateDir+'/show.formly.html',
        parent: angular.element(document.body),
        scope: scope,
        clickOutsideToClose:true
      }).result;
  };


  self.showSchemaFormDialog = function(form_data, dataCtrl) {
    var scope = $rootScope.$new()
    scope.form_data = form_data
    return $uibModal.open({
        controller: dataCtrl,
        templateUrl: templateDir+'/show.schemaform.html',
        parent: angular.element(document.body),
        scope: scope,
        clickOutsideToClose:true
      }).result;
  };
}

})();
