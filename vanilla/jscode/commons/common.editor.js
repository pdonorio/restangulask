(function() {
  'use strict';

angular.module('web')
    .controller('EditorController', EditorController)
    .controller('EditorNonDialogController', EditorNonDialogController);

function EditorController($scope, $sce, $log, $mdDialog, $timeout)
{
    var self = this;
    $log.debug("TransDialog", $scope.currentRecord);

    ////////////////////////////////
    // CONFIGURE EDITOR WYSIWYG
    ////////////////////////////////

    self.options = $scope.options;
    self.options.width = 600;
    self.options.height = 300;

    // Note: Make sure you using scopes correctly by following this wiki page. If you are having issues with your model not updating, make sure you have a '.' in your model.
    self.content = null;
    self.realHtml = null;
    if ($scope.currentText) {
        // If i don't use timeout, the content gets wiped
        $timeout(function () {
            self.content = angular.copy($scope.currentText); //.getTrustedHtml());
        }, 800);
    }
    //console.log("TEST CONTENT", self.content, $scope);

    $scope.$watch(
        "edit.content",
        function handleFooChange( newValue, oldValue ) {

            // if (newValue == oldValue)
            //     return;
            self.realHtml = $sce.trustAsHtml(oldValue);
            // $log.warn("HTML content watch:",
            //     "Old", oldValue, "New", newValue, "real", self.realHtml);
        }
    );

/*
    // Handle init
    self.options.setup = function(editor) {
      editor.on("init", function() {
        //self.editor.model = 'test <b>me</b> html';
        console.log("INIT!", editor);
        // $timeout(function () {
        //     editor.focus();
        // },50);
      });
      //editor.on("click", function() { console.log("CLICK!"); });
    }
*/

    //////////////////////////////
    // Other functions
    //////////////////////////////

    self.cancel = function() {
      $mdDialog.hide(false);
    };

    self.validate = function() {
      // send transcription back as original html
      $mdDialog.hide($sce.getTrustedHtml(self.realHtml));
    };

};

function EditorNonDialogController(
    $scope,
    $sce, $log,
    //$mdDialog,
    $timeout)
{
    var self = this;
    $log.debug("TransNonDialog", $scope.currentRecord);

    ////////////////////////////////
    // CONFIGURE EDITOR WYSIWYG
    ////////////////////////////////

    self.options = $scope.options;
    self.options.width = 590;
    self.options.height = 400;
    self.content = null;
    self.realHtml = null;
    if ($scope.currentText) {
        // If i don't use timeout, the content gets wiped
        $timeout(function () {
            self.content = angular.copy($scope.currentText);
        }, 800);
    }

/*
    //console.log("TEST CONTENT", self.content, $scope);
    $scope.$watch(
        "edit.content",
        function handleEditorHtml( newValue, oldValue ) {
            self.realHtml = $sce.trustAsHtml(oldValue);
            $log.debug("HTML content watch:",
                "Old", oldValue, "New", newValue, "real", self.realHtml);
        }
    );
*/

    //////////////////////////////
    // Other functions
    //////////////////////////////

    self.cancel = function() {
      //$mdDialog.hide(false);
      $scope.closeEdit();
    };

    self.validate = function() {

      // Validate HTML
      self.realHtml = $sce.trustAsHtml(self.content);
      // Send transcription back as original html
      $scope.validateEdit($sce.getTrustedHtml(self.realHtml), self.language);
      // Close the card
      $scope.closeEdit();
    };

    self.changeLanguage = function (language) {
      if ($scope.translation) {
        console.log("Changing language", language);
        if ($scope.translations[language])
            self.content = $scope.translations[language];
        else
            self.content = " ";
      }
    }

};

})();
