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
    self.content = null; //{ model: null };

    self.options = $scope.options;
    self.options.width = 600;
    self.options.height = 300;

    self.updateHtml = function() {
      self.mcehtml = $sce.trustAsHtml(self.content);
    };

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
      // send transcription back
      $mdDialog.hide(self.content);
    };

/*
    self.fileError = function(file, message) {
      file.status = 'fail';
      var json_message = angular.fromJson(message);
      //console.log(message, json_message);
      file.errorMessage = apiErrorToHtml(json_message.data);
      $log.warn("File error", file, file.errorMessage);
      $scope.showSimpleToast({
        "Failed to upload": file.name,
        //"Error message": message,
      }, 9000);
    };
*/

};

})();
