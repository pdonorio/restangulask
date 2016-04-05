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

function ExploreController($scope, $log, $state, SearchService, AdminService)
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

    $scope.parties = null;
    $scope.partiesElements = -1;
    return AdminService.getDocumentsWithNoImages()
      .then(function (out)
      {
        //console.log("DATA", out);
        $scope.partiesElements = out.elements;
        $scope.parties = out.data;
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
    $scope.transcripts = null;
    $scope.transcriptsElements = -1;
    return AdminService.getDocumentsWithNoTrans()
      .then(function (out)
      {
        $scope.transcriptsElements = out.elements;
        $scope.transcripts = out.data;
    });
};

function FixTransController($scope, $rootScope,
    $sce,
    $log, $timeout, $mdDialog, $window, AdminService)
{
    var self = this;
    self.elements = null;

    // TEST EDITOR
    self.content = null;
    self.realHtml = null;

    self.updateHtml = function() {
      console.log("received", self.content, $sce.trustAsHtml(self.content));
      //self.content = $sce.trustAsHtml(self.content);
    };
    $scope.$watch(
        "fix.content",
        function handleFooChange( newValue, oldValue ) {
            self.realHtml = $sce.trustAsHtml(oldValue);
            console.log( "watch:", oldValue, newValue );
        }
    );

    $log.debug("Fix Transcriptions Controller");

    self.noImageList = function (name, data) {
      self.elements = data;
      self.currentParty = name;
      $window.scrollTo(0, 0);
    }

    self.closeCard = function() {
      delete self.elements;
    }

    self.transcriptionDialog = function(record, name)
    {

      // Prepare data for the dialog
      $scope.currentRecord = record;
      $scope.currentType = 'documents';
      $scope.currentName = name;
      $scope.options = angular.copy($rootScope.tinymceOptions);
      $scope.options.setup = function (editor) {
          editor.on("init", function() {
            //self.editor.model = 'test <b>me</b> html';
            //console.log("INIT!", editor);
            $timeout(function () {
                //console.log("FOCUS!");
                editor.focus();
            }, 600);
          });
      }

      var dialogOptions = {
        templateUrl: blueprintTemplateDir + 'transcription.html',
        parent: angular.element(document.body),
        // I can pass my scope
        scope: $scope.$new(),
        // Note: THE $new() FUNCTION IS NECESSARY to duplicate
        // the scope inside the modal.
        // Otherwise, closing the modal would destroy the parent's scope
      }

      // Open
      $mdDialog.show(dialogOptions)
        .then(function (response) {
            $log.debug("Closed transcript dialog with", response);

/* REMOVE COMMENT
            if (response) {
                // Make the loader appear
                $scope.transcripts = null;
                //$scope.showSimpleToast({"Reloading data": null}, 1200);
                // Close the card
                self.closeCard();
                // Reload data
                getMissingTransData(AdminService, $scope);
            }
*/
        });
    }

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