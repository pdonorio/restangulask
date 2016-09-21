angular.module('web').controller('FormDialogController', FormDialogController);
angular.module('web').controller('FormlyDialogController', FormlyDialogController);
angular.module('web').controller('SchemaFormDialogController', SchemaFormDialogController);


function FormlyDialogController($scope, $mdDialog, $controller, FormlyService, noty) {
    $controller('FormDialogController', {$scope: $scope});

  $scope.createForm = function(promise, form_data) {
    promise.then(
      function(out_data) {
        var data = FormlyService.json2Form(out_data.data, form_data)

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

function SchemaFormDialogController($scope, $mdDialog, $controller, SchemaFormService, noty) {
    $controller('FormDialogController', {$scope: $scope});

  $scope.createForm = function(promise, form_data) {
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

function FormDialogController($scope, $mdDialog, noty) {

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

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.answer = function(answer) {
    $mdDialog.hide(answer);
  };

}

var showFormlyDialog = function(ev, $mdDialog, $mdMedia, form_data, dataCtrl) {
  return $mdDialog.show({
      controller: dataCtrl,
      templateUrl: self.templateDir+'/show.formly.html',
      parent: angular.element(document.body),
      locals: {
        form_data: form_data
      },
      targetEvent: ev,
      clickOutsideToClose:true,
      fullscreen: (!$mdMedia('sm') || $mdMedia('xs'))
    });
};


var showSchemaFormDialog = function(ev, $mdDialog, $mdMedia, form_data, dataCtrl) {
  return $mdDialog.show({
      controller: dataCtrl,
      templateUrl: self.templateDir+'/show.schemaform.html',
      parent: angular.element(document.body),
      locals: {
        form_data: form_data
      },
      targetEvent: ev,
      clickOutsideToClose:true,
      fullscreen: (!$mdMedia('sm') || $mdMedia('xs'))
    });
};
