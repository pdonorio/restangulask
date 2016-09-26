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

function DialogController($scope, $uibModalInstance) {
    $scope.cancel = function() {
      $uibModalInstance.dismiss();
    };
    $scope.confirm = function(answer) {
      $uibModalInstance.close(answer);
    };
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

  self.showConfirmDialog = function(text, subtext) {
    var template = "<div class='panel panel-warning text-center' style='margin-bottom:0px;'>";
        template+= "<div class='panel-heading'>Confirmation required</div>";
        template+= "<div class='panel-body'><h4>"+text+"</h4><br>"+subtext+"</div>";
        template+= "<div class='panel-footer'>";

        template+= "<div class='row'>";
        template+= "<div class='col-xs-4 col-xs-offset-2'>";
        template+= "<button class='btn btn-danger' ng-click='confirm()'>Yes</button>";
        template+= "</div>";
        template+= "<div class='col-xs-4'>";
        template+= "<button class='btn btn-default' ng-click='cancel()'>No</button>";
        template+= "</div>";

        template+= "</div>";
        template+= "</div>";

    return $uibModal.open({
      controller: DialogController,
      template: template,
      parent: angular.element(document.body),
      clickOutsideToClose:true
    }).result;
  }
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
