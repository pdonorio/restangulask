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

function ExploreController($scope, $log, $state, AdminService)
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

function FixTransController($scope, $rootScope, $sce,
    $log, $timeout, $mdDialog, $window, AdminService, SearchService)
{
    var self = this;
    self.elements = null;

    $log.debug("Fix Transcriptions Controller");

    self.noImageList = function (name, data) {
      self.elements = data;
      self.currentParty = name;
      $window.scrollTo(0, 0);
      delete self.currentText;
    }

    $scope.closeEdit = function() {
      $window.scrollTo(0, 0);
      delete self.currentText;
    }

    self.closeCard = function() {
      delete self.elements;
    }

    $scope.baseLanguages = [
        'Francais', 'Italiano', 'Latino',
    ];
    $scope.selectedLanguage = null;

    self.translationDialog = function(record, name)
    {
// TO FIX
    // "language":  "something" ,   // cannot be empty
    // "translation": true


      // Prepare data for the dialog
      $scope.currentRecord = record;
      $scope.currentType = 'documents';
      $scope.currentName = name;
      $scope.options = angular.copy($rootScope.tinymceOptions);
      $scope.options.setup = function (editor) {
          editor.on("init", function() {
            $timeout(function () { editor.focus(); }, 600);
          });
      }
      $scope.translation = true;
      $scope.translations = {};
      $scope.currentText = " ";
      $scope.languages = angular.copy($scope.baseLanguages);
      $scope.initialLanguage = $scope.languages[0];

      // Fill data if exists
      SearchService.getDocs(record).then(function (out) {

        if (out.data[0].images && out.data[0].images.length > 0) {
            var trans = "";
            var data = out.data[0].images[0];

            if (data.hasOwnProperty('translations')) {

              // Get all languages
              forEach(data.translations, function(trans, language) {
                  $scope.translations[language] = trans;
              });
              //console.log("Translations", $scope.translations);

              // Show the first one
              if (Object.keys($scope.translations).length > 0) {
                $scope.initialLanguage = Object.keys($scope.translations)[0];
                if (
                    $scope.translations[$scope.initialLanguage] &&
                    $scope.translations[$scope.initialLanguage].trim() != "")
                {
                    $scope.currentText = angular.copy(
                          $scope.translations[$scope.initialLanguage]);
                }
              }

            }
        }
        self.currentText = $scope.currentText;

        }); // end of filling
    }


    self.transcriptionDialog = function(record, name)
    {

      // Prepare data for the dialog
      $scope.currentRecord = record;
      $scope.currentType = 'documents';
      $scope.currentName = name;
      $scope.options = angular.copy($rootScope.tinymceOptions);
      $scope.translation = false;
      $scope.currentText = " ";
      $scope.languages = ['-'];
      forEach($scope.baseLanguages, function(x, i) {
          $scope.languages.push(x);
      });

      $scope.options.setup = function (editor) {
          editor.on("init", function() {
            // If i want to init the variable
            //self.editor.model = 'test <b>me</b> html';
            // Give focus to textarea
            $timeout(function () { editor.focus(); }, 600);
          });
      }

      // Fill data if exists
      SearchService.getDocs(record).then(function (out) {

          if (! out.data[0] || ! out.data[0].hasOwnProperty('images')) {
            $window.scrollTo(0, 0);
            var errors = {};
            errors[name] = 'does not have an image associated!';
            $scope.showSimpleToast(errors, 4200);
            return false;
          }

          if (out.data[0].images
              && out.data[0].images.length > 0
              && out.data[0].images[0].transcriptions
              && out.data[0].images[0].transcriptions.length > 0)
          {

                var trans = out.data[0].images[0].transcriptions[0];
                if (trans != null && trans.trim() != "") {
                    $scope.currentText = angular.copy(trans);
                    $scope.initialLanguage = out.data[0].images[0]['language'];
                }
          }

          // Apply $sce?
          self.currentText = $scope.currentText;

        }); // end of filling
    }

    //////////////////////////////////
    // SAVE DATA!
    $scope.validateEdit = function (transcription, language)
    {
      //console.log("Writing transcription", transcription);
      var data = {};
      data.type = $scope.currentType;
      data.language = language;
      data.transcription = transcription;
      data.translation = $scope.translation;

      return AdminService.setDocumentTrans(
            $scope.currentRecord, data).then(function(out)
      {
          console.log("SET OUT", out);
      });
    }

};

////////////////////////////////
// controller
////////////////////////////////

function StepsController($scope, $log, $state, $window, SearchService)
{
    // INIT controller
    $log.debug("Stepping in pieces");
    var self = this;
    self.element = null;
    self.cookieKey = 'searchParameters';

    self.headers = [
        'Fete',
        //'Fête',
        'Source',
        'Type',
        'Lieu',
        'Date',
    ];

    SearchService.getFetes().then(function (out) {
      self.data = [];
      if (out) {
          self.data = out.data;
          self.parties = [];
          forEach(self.data, function(value, key){
            var tmp = {
                'Fete': String(value["Titre abrégé"]),
                'Lieu': value['Lieu'],
                'Date': value['Date'],
                //'Date': parseInt(value['Date']),
            };
            var sources = "";
            forEach(value['Titre abrégé de la source'], function(source, index){
                sources += source + '<br> ';
            });
            tmp['Source'] = sources;
            tmp['Type'] = value["Type de fête 1"] + ' <br> ' + value["Type de fête 2"];
            tmp['key'] = key;
            self.parties.push(tmp);
          });
          console.log("Parties", self.parties);

           self.dataCount = out.elements;
      } else {
           self.dataCount = self.data.length;
      }
    });

    $scope.reverse = false;
    // $scope.reverse = true;

    self.toggleSort = function(index) {
        if($scope.sortColumn === self.headers[index]){
            $scope.reverse = !$scope.reverse;
        }
        $scope.sortColumn = self.headers[index];
        console.log("Sort", $scope.sortColumn, $scope.reverse)
    }

    self.selectElement = function (name) {
      self.element = self.data[name];
      console.log("Element", self.element);
      $window.scrollTo(0, 0);
    }

    self.closeElement = function() {
      delete self.element;
    }

    // search for this source?
    self.searchSource = function(source) {
        console.log("search for", source)
        localStorage.removeItem(self.cookieKey);
        localStorage.setItem(self.cookieKey, JSON.stringify({
            source: source
        }));
        console.log("TEST", self.cookieKey,
            JSON.parse(localStorage.getItem(self.cookieKey)) )
        $state.go('public.fastsearch');
    }
}


})();