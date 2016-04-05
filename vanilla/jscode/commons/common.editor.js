(function() {
  'use strict';

angular.module('web')
    .controller('EditorController', EditorController);


function EditorController($scope, $sce, $log, $mdDialog)
{
    var self = this;
    $log.debug("TransDialog", $scope.currentRecord);

    ////////////////////////////////
    // CONFIGURE EDITOR WYSIWYG
    ////////////////////////////////

    // Note: Make sure you using scopes correctly by following this wiki page. If you are having issues with your model not updating, make sure you have a '.' in your model.
    self.content = null;
    self.realHtml = null;

    self.options = $scope.options;
    self.options.width = 600;
    self.options.height = 300;

    $scope.$watch(
        "edit.content",
        function handleFooChange( newValue, oldValue ) {
            self.realHtml = $sce.trustAsHtml(oldValue);
            //$log.debug("HTML content watch:", oldValue);
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

})();
