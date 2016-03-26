(function() {
  'use strict';

angular.module('web')
    .controller('UploadController', UploadController);


function UploadController($scope, $log, $mdDialog)
{
    var self = this;
    $log.debug("Uploader", $scope.currentRecord);

    self.response = false;

    //////////////////////////////
    // Flow library configuration
    //////////////////////////////
    self.config = {
        // Passing data to the flow HTTP API call
        query: function (flowFile, flowChunk) {
          return {
            // record id with all the documents
            record: $scope.currentRecord,
            // destination is what this document/image is for
            destination: $scope.currentType,
          };
        }
    }

    //////////////////////////////
    // Other functions
    //////////////////////////////

// Buttons actions in the dialog
    self.validate = function() {
      // Tell the parent if we uploaded something
      $mdDialog.hide(self.response);
    };

    self.uploaded = function(file) {
      file.status = 'uploaded';
      self.response = true;
      $log.info("File uploaded", file);
    };

    self.adding = function(file, ev, flow) {

// LIMIT FILE SIZE?
// There should be no limit if you don't put any. To avoid:
// flow-file-added="$file.size < 1024"

// LIMIT FILE TYPE?
//!!{png:1,gif:1,jpg:1,jpeg:1}[$file.getExtension()]

      file.status = 'progress';
      file.record = $scope.currentRecord;
      $log.debug("File adding", file, ev, flow);
      $scope.showSimpleToast( {"Uploading the file": file.name}, 1800);
    };

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

/*
    self.otherError = function(file, message) {
      $log.warn("Upload error", file, message);
      $scope.showSimpleToast({
        "Failed to flow": file.name,
        "Error is": message,
      });
    };
*/

};

})();