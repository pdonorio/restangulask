(function() {
  'use strict';

angular.module('web')
    .controller('DetailsController', DetailsController);

function DetailsController($scope, $log, $sce, $stateParams, $auth, SearchService)
{
    var self = this;
    $log.info("Single view on", $stateParams.id);
    self.logged = $auth.isAuthenticated();

    self.load = true;
    self.data = null;
    self.texts = {}
    self.query = $stateParams.query;
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
                                    if (x.trim() != '')
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
            ////////////////////////////////////
            // FIND NAMES, and previous and next
            var
                field = "Numero de l'extrait",
                name = out_single['Extrait'][field],
                codes = name.split('_'),
                num = parseInt(codes.pop()),
                prefix = codes.join('_'),
                previous_code = prefix + "_" + String(num - 1),
                next_code = prefix + "_" + String(num + 1);

            var
                regexp = /[0-9]+/g,
                matches = name.match(regexp),
                page = null;

            if (matches && matches.length > 0) {
                page = parseInt(matches[0]);
                previous_code = name.replace(regexp, page - 1);
                next_code = name.replace(regexp, page + 1);
            }
            // console.log('CODES', num, previous_code, next_code, page);

            // SEARCH WITH APIs
            self.previous.text = previous_code;
            SearchService.recoverCode(previous_code, field).then(function (out)
            {
                //$log.warn("OUT PREV IS", out);
                if (out.elements && out.elements > 0) {
                    self.previous.link = out.data[0].record;
                } else {
                    self.previous.link = null;

                }
            });
            self.next.text = next_code;
            SearchService.recoverCode(next_code, field).then(function (out)
            {
                if (out.elements && out.elements > 0) {
                    self.next.link = out.data[0].record;
                } else {
                    self.next.link = null;
                }
                //$log.warn("Link avaialble")
            })
            ////////////////////////////////////
            ////////////////////////////////////

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

                    // Set the initial language
                    self.texts[self.original_language] = $sce.trustAsHtml(trans);
                    self.current_text = self.texts[self.original_language];

                  });
              }

              if (element.translations) {
                forEach(element.translations, function(trans, language) {
                    // statements
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

    self.selectLanguage = function () {
      console.log('Selected', self.selected_language);
      self.current_text = self.texts[self.selected_language];
// Take focus out?
    }

    // Use it
    loadData();
}

})();
