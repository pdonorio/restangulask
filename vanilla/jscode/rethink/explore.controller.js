(function() {
  'use strict';

angular.module('web')
    .controller('ExploreController', ExploreController)
    .controller('FixImagesController', FixImagesController)
    .controller('FixTransController', FixTransController)
    .controller('StepsController', StepsController)
    ;

////////////////////////////////
// controller
////////////////////////////////

function ExploreController($scope, $rootScope, $log, $state, SearchService, AdminService)
{

  // INIT controller
  var self = this;
  $log.debug("Explore data: controller");

  // INIT scope variables
  $scope.data = {};
  $scope.results = false;

  //TABS
  self.selectedTab = null;
  self.onTabSelected = function (key)
  {
      $log.debug("Selected", key, self.selectedTab);

// THIS IS WHERE YOU ADD THE DATA LOAD LOGIC FOR TABS
      if (key == 'transfix') {
        getMissingTransData(AdminService, $scope);
      }
      if (key == 'imagefix') {
        getMissingImagesData(AdminService, $scope);
      }
  }

}

////////////////////////////////
// Fix images
////////////////////////////////

function getMissingImagesData(AdminService, $scope) {
    return AdminService.getDocumentsWithNoImages()
      .then(function (out)
      {
        //console.log("DATA", out);
        $scope.parties = out.data;
        $scope.partiesElements = out.elements;
    });
};

function FixImagesController($scope, $log, $mdDialog, $window, AdminService)
{
    $log.debug("Fix Controller");
    var self = this;
    self.noImageList = function (name, data) {
      self.elements = data;
      self.currentParty = name;
      $window.scrollTo(0, 0);
    }

    self.closeCard = function() {
      delete self.elements;
    }

/////////////////////////////////////

    self.uploaderDialog = function(record, name)
    {

      // Prepare data for the dialog
      $scope.currentRecord = record;
      $scope.currentType = 'documents';
      $scope.currentName = name;

      var dialogOptions = {
        templateUrl: blueprintTemplateDir + 'uploader.html',
        //controller: UploadController,
// Not working if controller is declared inside the dialog HTML
// http://blog.thoughtram.io/angularjs/2015/01/02/exploring-angular-1.3-bindToController.html
        //bindToController: true,
        parent: angular.element(document.body),
// But I can pass my scope...
// https://github.com/angular/material/issues/455#issuecomment-114017738
        scope: $scope.$new(),
// Note: THE $new() FUNCTION IS NECESSARY to duplicate the scope inside the modal.
// Otherwise, closing the modal would destroy the parent's scope
        //clickOutsideToClose:true,
        //onComplete: function
      }

      // Open
      $mdDialog.show(dialogOptions)
        .then(function (response) {
            $log.debug("Closed dialog with", response);
            if (response) {
                // Make the loader appear
                $scope.parties = null;
                $scope.showSimpleToast({"Reloading data": null}, 1200);
                // Close the card
                self.closeCard();
                // Reload data
                getMissingImagesData(AdminService, $scope);
            }
        });
    }
/////////////////////////////////////

};

////////////////////////////////
// fix transcriptions
////////////////////////////////

function getMissingTransData(AdminService, $scope) {
    return AdminService.getDocumentsWithNoTrans()
      .then(function (out)
      {
        $scope.transcripts = out.data;
        $scope.transcriptsElements = out.elements;
    });
};

function FixTransController($scope, $rootScope,
    $log, $timeout, $mdDialog, $window, AdminService)
{
    var self = this;
    self.elements = null;
    $log.debug("Fix Transcriptions Controller");

    ////////////////////////////////
    // CONFIGURE EDITOR WYSIWYG
    ////////////////////////////////

    // Note: Make sure you using scopes correctly by following this wiki page. If you are having issues with your model not updating, make sure you have a '.' in your model.
    self.editor = { model: null };
    self.options = angular.copy($rootScope.tinymceOptions);

    // Handle init
    self.options.setup = function(editor) {
      editor.on("init", function() {
        self.editor.model = 'test <b>me</b> html';
        //console.log("INIT!", editor);
        editor.focus();
      });
      //editor.on("click", function() { console.log("CLICK!"); });
    }

/*
    self.noImageList = function (name, data) {
      self.elements = data;
      self.currentParty = name;
      $window.scrollTo(0, 0);
    }

    self.closeCard = function() {
      delete self.elements;
    }

/////////////////////////////////////

    self.uploaderDialog = function(record, name)
    {

      // Prepare data for the dialog
      $scope.currentRecord = record;
      $scope.currentType = 'documents';
      $scope.currentName = name;

      var dialogOptions = {
        templateUrl: blueprintTemplateDir + 'uploader.html',
        //controller: UploadController,
// Not working if controller is declared inside the dialog HTML
// http://blog.thoughtram.io/angularjs/2015/01/02/exploring-angular-1.3-bindToController.html
        //bindToController: true,
        parent: angular.element(document.body),
// But I can pass my scope...
// https://github.com/angular/material/issues/455#issuecomment-114017738
        scope: $scope.$new(),
// Note: THE $new() FUNCTION IS NECESSARY to duplicate the scope inside the modal.
// Otherwise, closing the modal would destroy the parent's scope
        //clickOutsideToClose:true,
        //onComplete: function
      }

      // Open
      $mdDialog.show(dialogOptions)
        .then(function (response) {
            $log.debug("Closed dialog with", response);
            if (response) {
                // Make the loader appear
                $scope.parties = null;
                $scope.showSimpleToast({"Reloading data": null}, 1200);
                // Close the card
                self.closeCard();
                // Reload data
                getMissingTransData(AdminService, $scope);
            }
        });
    }
*/

};

////////////////////////////////
// controller
////////////////////////////////

function StepsController($scope, $log, $state, SearchService)
{
  // INIT controller
  $log.debug("Stepping in pieces");
  var self = this;
  self.step = 2;

  SearchService.getDistinctValuesFromStep(self.step).then(function (out)
  {
        self.data = [];
        self.dataCount = self.data.length;
       if (out) {
           self.dataCount = out.elements;
           self.data = out.data;
       }
  })
}


})();