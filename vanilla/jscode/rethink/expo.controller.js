(function() {
  'use strict';

angular.module('web')
    .controller('ExpoClient', ExpoClient)
    .controller('ExpoController', ExpoController);

function ExpoClient($scope, $log,
    $location, $window, $timeout, $anchorScroll,
    AdminService)
{
    var self = this;
    $log.info("EXPO: client");
}

function ExpoController($scope, $log,
    $location, $window, $timeout, $anchorScroll,
    AdminService)
{

    // INIT controller
    var self = this;
    $log.debug("EXPO: controller");

    self.type = 'expo';
    self.current = null;
    self.newelement = "ADD NEW ELEMENT";
    self.position = 1;

    $scope.keylen = function (obj) {
      if (obj)
          return Object.keys(obj).length;
      return 0;
    }

    self.details = {
        position: {type: 'number'},
        title: {type: 'text', required: true},
        name: {type: 'text'},
        author: {type: 'text'},
        date: {type: 'text'},
        place: {type: 'text'},
        book: {type: 'text'},
        material: {type: 'text'},
        description: {type: 'text'},
    }

    //Recover data
    self.reload = function () {

        self.sections = [];

        AdminService.getExpo().then(function (out)
        {
          AdminService.getExpoSections().then(function (output) {

            self.sectionsAndThemes = output.data;
            for(var k in self.sectionsAndThemes) self.sections.push(k);
            //self.sections = Array(Object.keys(self.sectionsAndThemes));
          });
          //console.log("Getting data", out.data);
          console.log("Reloaded EXPO data.");
          var files = {};
          // IF DATA IS PRESENT
          if (out.data) {

            forEach(out.data, function (element, index) {
                if (element.details && element.details.position
                        && element.details.position > self.position
                        ) {
                    self.position = element.details.position;

                }
            //   if (element && element != '') {
            //     //console.log("Element", element.images[0]);
            //     files[element.record] =
            //         self.type + '/' + element.images[0].code;
            //   }
            });
            // self.files = files;

            self.files = out.data;
          }

          // Give the possibility to add new elements
          self.sections.push(self.newelement);

// LATEST POSITION

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

      self.reloadThemes(self.files[uuid].section);

      self.current = self.files[uuid];
      $log.info("Selected", uuid, self.current);
      if (!self.current.details) {
        self.current.details = {}
      }
      if (!self.current.details.position) {
        self.current.details.position = self.position + 1;
      }


      $timeout(function () {
          $scope.gotoAnchor("edit");
      })

    }

    self.remove = function (uuid) {
      AdminService.delExpoElement(uuid).then(function (out){
        console.log("Delete", uuid, out);
        $scope.showSimpleToast({'Removed':'requested element'});
        self.reload();
      });
    }

    self.reloadThemes = function (section) {

      if (self.current) {
          // Clean choices
          self.current.theme = null;
          self.current.newtheme = null;
      }

      // THEMES
      self.themes = [];
      if (self.sectionsAndThemes[section])
          self.themes = angular.copy(self.sectionsAndThemes[section]);

      // Give the possibility to add new elements
      self.themes.push(self.newelement);

    }

    self.save = function () {

        var error = false;
        // ERROR if missing required field
        if (self.myForm.$invalid)
            error = true;

        // ERROR if no section or theme
        if (!self.current.section && !self.current.newsection)
            error = true;

        if (!self.current.theme && !self.current.newtheme)
            error = true;

        if (error) {
            console.log("Error")
            $window.scrollTo(0, 0);
            //$timeout(function () { $scope.gotoAnchor("upload"); })
            $scope.showSimpleToast({'Warning':'Missing required fields'});
            return false;
        }

      //console.log("Should save", self.current);
  // API CALL
      AdminService.setExpoElement(self.current.id, self.current)
       .then(function (out){
            //console.log("PUT", out);
            $scope.showSimpleToast({'Saved': self.current.id});
            self.close();
      });

    }

    self.close = function () {
      self.reload();
      delete self.current;
      $window.scrollTo(0, 0);
      //$timeout(function () { $scope.gotoAnchor("upload"); })
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