(function() {
  'use strict';

angular.module('web')
    .controller('ExpoController', ExpoController);

function ExpoController($scope, $log, $location, $timeout, $anchorScroll, AdminService)
{

    // INIT controller
    var self = this;
    $log.debug("EXPO: controller");
    self.type = 'expo';
    self.current = null;

    //Recover data
    self.reload = function () {

        AdminService.getExpo().then(function (out)
        {
          //console.log("Getting data", out.data);
          var files = {};
          // IF DATA IS PRESENT
          if (out.data && out.data.length > 0) {

            forEach(out.data, function (element, index) {
              if (element && element != '') {
                console.log("Element", element.images[0]);
                files[element.record] =
                    self.type + '/' + element.images[0].code;
              }
            });

            self.files = files;
          }

        });
    }
    self.reload();

    //////////////////////////////
    // functions

    $scope.gotoAnchor = function(newHash) {
      //source: https://docs.angularjs.org/api/ng/service/$anchorScroll

      if ($location.hash() !== newHash) {
        // set the $location.hash to `newHash` and
        // $anchorScroll will automatically scroll to it
        $location.hash(newHash);
      } else {
        // call $anchorScroll() explicitly,
        // since $location.hash hasn't changed
        $anchorScroll();
      }
    };

    self.update = function (uuid) {
      console.log("TEST", uuid);
      self.current = {
        id: uuid,
        name: 'Just a Test',
      };
      $timeout(function () {
          $scope.gotoAnchor("edit");
      })

    }

    self.remove = function (uuid) {
      console.log("TEST TRASH", uuid);
    }

    self.close = function () {
      delete self.current;
      $timeout(function () {
          $scope.gotoAnchor("upload");
      })
    }

    //////////////////////////////
    // Flow library upload
    //////////////////////////////

    self.config = {
        // Passing data to the flow HTTP API call
        query: function (flowFile, flowChunk) {
          return {
            // // record id with all the documents
            record: "GENERATE",

            // destination is what this document/image is for
            destination: 'expo',
          };
        }
    }

    self.uploaded = function(file) {
      file.status = 'uploaded';
      $log.info("File uploaded", file);
      self.reload();
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


}


})();