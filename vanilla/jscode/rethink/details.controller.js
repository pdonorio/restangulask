(function() {
  'use strict';

angular.module('web')
    .controller('DetailsController', DetailsController)
    .controller('BrokenController', BrokenController);

function BrokenController($scope, $log, AdminService)
{
    var self = this;
    $log.info("Broke");
    self.list = {};

    AdminService.listCorrupted().then(function(out) {
        if (out) {
            self.order = Object.keys(out).sort();
            self.list = out;
            console.log("Uhm", self);
        }
    });
}

function DetailsController($scope,
    $log, $sce, $stateParams, $auth, $window, $mdToast, $timeout, $state,
    $mdBottomSheet,
    SearchService, AdminService)
{
    var self = this;
    $log.info("Single view on", $stateParams.id);
    self.logged = $auth.isAuthenticated();

    var getSelectionText = function() {
          var text = "";
          if (window.getSelection) {
              text = window.getSelection().toString();
          } else if (document.selection && document.selection.type != "Control") {
              text = document.selection.createRange().text;
          }
          return text;
    };

    self.showListBottomSheet = function() {
        // $scope.alert = '';
        var text = getSelectionText();
        if (text.trim() == '')
            return false;

        $mdBottomSheet.show({
          // template: 'just a test',
          templateUrl: blueprintTemplateDir + 'bottom_sheet.html' ,
          locals: {selection: getSelectionText()},
          // controller: 'ListBottomSheetCtrl'
          controller: function($scope, selection, SearchService)
          {
            $scope.rows = null;
            $scope.selected = selection;
            $scope.fields = [
                'sheet', 'macro', 'micro',
                'titre', 'latin', 'français', 'italiano'
            ];
            // console.log("TEST", selection);

            SearchService.getFastLex(selection).then(function(out){
              if (out && out.elements) {
                if (out.elements > 0) {
                    console.log("OUT", out);
                    $scope.rows = out.data;
                }
              }
            });

          }
        })
        .then(function(from) {
            console.log("CLOSED", from);
            // $scope.alert = clickedItem['name'] + ' clicked!';
        })
        ;
    };

    self.goBack = function() {
      window.history.back();
    };

    self.cookieKey = 'searchParameters';
    self.filters = JSON.parse(localStorage.getItem(self.cookieKey));
    self.highlightText = null;
    self.query = $stateParams.query;
    if (self.query) {
        self.highlightText = self.query;
    }
    if (self.filters)
        if (self.filters.searchText)
            self.highlightText = self.filters.searchText;

    self.load = true;
    self.data = null;
    self.toast = null;
    self.texts = {};
    self.pages = {}
    self.pagesElements = 0;
    $scope.theid = $stateParams.id;
    $scope.quote = "'";

    function loadData() {

      self.load = true;

      var empty = {text: '..loading..', link: ''};
      self.previous = angular.copy(empty);
      self.next = angular.copy(empty);

      // STEPS INFO
      SearchService.getSteps().then(function(steps)
      {
        // This call is needed inside Search Service
        // at least once for Controller

        $scope.stepnames = steps;

        // SINGLE DETAILS
        SearchService.getSingleData($stateParams.id, true)
         .then(function(out_single)
        {
            if (! out_single)
            {
              $scope.showSimpleToast({"No data found": "unknown id"});
              return false;
            }

            // Set data
            var tmp = angular.copy(out_single);
            delete tmp.id;
            delete tmp.thumb;
            delete tmp.images;

// SHOULD I CYCLE TO REMOVE EMPTY?
            forEach(tmp, function(element, index) {
                forEach(element, function(obj, j) {
                    // console.log("element", j, "*" + obj + "*");
                    if (obj) {
                        if (obj.hasOwnProperty('trim') && obj.trim() == '') {
                            tmp[index][j] = null;
                        }
                        if (obj instanceof Array) {
                            tmp[index][j] = null;
                            if (obj.length > 0) {
                                tmp[index][j] = "";
                                forEach(obj, function(x, y) {
                    // console.log("UHM", x, y);
                                    if (y > 0)
                                        tmp[index][j] += ', ';
                                    if (x && x.trim() != '')
                                        tmp[index][j] += x.trim();
                                });
                            }
                        }
                    }
                });

            });

            self.refinedData = tmp;
            console.log("DATA IS", self.refinedData);

            var key = 'Fête';
            self.refinedData.date = true;

            var i = "Date de début de la fête";
            if (typeof self.refinedData[key][i] === 'undefined')
                self.refinedData.date = false;
            else
                self.refinedData[key][i] =
                    new Date(self.refinedData[key][i]);

            i = "Date de la fin de la fête";
            if (typeof self.refinedData[key][i] === 'undefined')
                self.refinedData.date = false;
            else
                self.refinedData[key][i] =
                    new Date(self.refinedData[key][i]);

            ////////////////////////////////////
            // PAGES
            ////////////////////////////////////

            self.first_page = null;
            self.previous_page = null;
            self.next_page = null;
            self.last_page = null;
            var
                field = "Numero de l'extrait",
                fete = self.refinedData["Fête"]["Titre abrégé"],
                source = self.refinedData["Source"]["Titre abrégé"],
                current = self.refinedData["Extrait"][field];

            var linkName = self.refinedData['Source']['Liens'];
            if (linkName && linkName.trim() != '') {
                var tmp = linkName
                    .replace("https://", '')
                    .replace("http://", '')
                var n = tmp.indexOf('/');
                linkName = tmp.substring(0, n != -1 ? n : tmp.length);
                console.log("Link", linkName, tmp);
            }
            self.link = linkName;

            // SearchService.recoverPages(fete, current).then(function (out)
            SearchService.recoverPages(source, current).then(function (out)
            {
                console.log("Pages", out);
                self.page = null;
                if (out && out.elements && out.elements > 0) {
                    self.pages = out.data;
                    self.pagesElements = out.elements;
                } else {
                    self.pages = null;
                    return false;
                }
                var last = null, current = false, passed_current = false;
                forEach(self.pages, function(value, key){
                    if (last) {
                        if (!self.first_page)
                            self.first_page = last;
                        if (!passed_current && !current)
                            self.previous_page = last;
                    }
                    if (current) {
                        self.next_page = value;
                        current = false;
                        passed_current = true;
                    } else if (value.current) {
                        // self.page = key;
                        self.page = value.id;
                        current = true;
                    }
                    last = value;
                    self.last_page = value;
                });

            });

            // ////////////////////////////////////
            // ////////////////////////////////////
            // // FIND NAMES, and previous and next
            // var
            //     field = "Numero de l'extrait",
            //     name = out_single['Extrait'][field],
            //     codes = name.split('_'),
            //     num = parseInt(codes.pop()),
            //     prefix = codes.join('_'),
            //     previous_code = prefix + "_" + String(num - 1),
            //     next_code = prefix + "_" + String(num + 1);

            // var
            //     regexp = /[0-9]+/g,
            //     matches = name.match(regexp),
            //     page = null;

            // if (matches && matches.length > 0) {
            //     page = parseInt(matches[0]);
            //     previous_code = name.replace(regexp, page - 1);
            //     next_code = name.replace(regexp, page + 1);
            // }
            // // console.log('CODES', num, previous_code, next_code, page);

            // // SEARCH WITH APIs
            // self.previous.text = previous_code;
            // SearchService.recoverCode(previous_code, field).then(function (out)
            // {
            //     //$log.warn("OUT PREV IS", out);
            //     if (out.elements && out.elements > 0) {
            //         self.previous.link = out.data[0].record;
            //     } else {
            //         self.previous.link = null;
            //     }
            // });
            // self.next.text = next_code;
            // SearchService.recoverCode(next_code, field).then(function (out)
            // {
            //     if (out.elements && out.elements > 0) {
            //         self.next.link = out.data[0].record;
            //     } else {
            //         self.next.link = null;
            //     }
            // })
            // ////////////////////////////////////
            // ////////////////////////////////////

// REWRITE IMAGES and TRANSCRIPTIONS

            self.original_language = 'original';

            forEach(out_single.images, function(element, index) {

              self.texts = {}

              if (element.transcriptions) {
                  forEach(element.transcriptions, function(trans, j) {
                    //console.log("Trans", j, trans);

                    out_single.images[index].transcriptions[j] =
                        angular.copy($sce.trustAsHtml(trans));
                    if (element.language)
                        self.original_language = element.language;

// TO FIX: BUG it may highlight HTML element too!
// http://localhost/public/details/05e1fd2f-fd11-4283-a172-737ee2d2933c?query=ass
                    // Set the initial language
                    if (self.highlightText) {
                        trans = trans.replace(
                            new RegExp('(' + self.highlightText + ')', 'gi'),
                            '<span class="highlightedText">$&</span>');
                        // console.log("traduzioni", trans);
                    }
                    self.texts[self.original_language] = $sce.trustAsHtml(trans);
                    self.current_text = self.texts[self.original_language];
                    // console.log("TEST", self.current_text, trans, self.highlightText);

                  });
              }

              if (element.translations) {
                forEach(element.translations, function(trans, language) {
                    // highlight also translations
                    if (self.highlightText) {
                        trans = trans.replace(
                            new RegExp('(' + self.highlightText + ')', 'gi'),
                            '<span class="highlightedText">$&</span>');
                    }
                    self.texts[language] = $sce.trustAsHtml(trans);
                });
              }

              // show select only if at least 2 elements

            });

            console.log('LANGUAGES', self.texts);
            self.languages = Object.keys(self.texts);
            self.selected_language = self.original_language;

            self.data = out_single;
            self.load = false;

        }); // single data
      }); // steps
    } // END loadData FUNCTION

    self.changePage = function() {
        console.log("Selected", self.page);
        if (self.page) {
            $timeout(function () {
                $state.go("public.details", {id: self.page}); }, 200);
        }
    };

    self.selectLanguage = function () {
      console.log('Selected', self.selected_language);
      self.current_text = self.texts[self.selected_language];
// Take focus out?
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
            destination: 'documents',
          };
        }
    }

    self.changeImage = function(file, options) {
      $mdToast.hide(self.toast).then(function(){
          $scope.showSimpleToast( {"Uploaded": file.name}, 1800);
      });
      console.log('CHANGE', file, $scope.theid);
      // api call with id + file.name
      AdminService.updateDocImage($scope.theid, file.name).then(function (out) {
          console.log('Updated', out);
          // which removes old id record, and updates details to new one
          loadData();
      })
    };

    self.adding = function(file, ev, flow) {

      file.status = 'progress';
      file.record = $scope.currentRecord;
      $log.debug("File adding", file, ev, flow);
      self.toast = $scope.showSimpleToast( {"Uploading": file.name}, 0);
    };

    self.fileError = function(file, message) {
      //$mdToast.hide(self.toast);
      file.status = 'fail';
      var json_message = angular.fromJson(message);
      console.log(message, json_message, json_message.data.errors[0]);
      // file.errorMessage = apiErrorToHtml(json_message.data);
      // $log.warn("File error", file, file.errorMessage);
      $window.scrollTo(0, 0);
      var arrayError = json_message.data.errors[0];
      // arrayError['Failed to upload'] = file.name;
      $mdToast.hide(self.toast).then(function(){
          $scope.showSimpleToast(
            arrayError
              // {
              //   "Failed to upload": file.name,
              //   "Error message": json_message.data.errors[0],
              // }
              , 7000);
        });
    };

    self.eternalRemoval = function() {

        $scope.showSimpleToast({"Removing": "record " + $scope.theid});

        // call admin/search service
        SearchService.removeElement($scope.theid).then(function() {
            console.log("Removed", $scope.theid);
            // redirect to search page
            $timeout(function () { $state.go("public.fastsearch"); }, 2200);
        });

    }

    //////////////////////////////
    // Init
    //////////////////////////////
    loadData();

}

})();
