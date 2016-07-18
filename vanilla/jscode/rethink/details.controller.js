(function() {
  'use strict';

angular.module('web')
    .controller('DetailsController', DetailsController);

function DetailsController($scope, $log, $sce, $stateParams, SearchService)
{
    $log.info("Single view on", $stateParams.id);
    var self = this;
    self.load = true;
    self.data = null;
    self.query = $stateParams.query;

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
                    //console.log("element", j, "*" + obj + "*");
                    if (obj && obj.trim() == '') {
                        tmp[index][j] = null;
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
                codes = out_single['Extrait'][field].split('_'),
                num = parseInt(codes.pop()),
                prefix = codes.join('_'),
                previous_code = prefix + "_" + String(num - 1),
                next_code = prefix + "_" + String(num + 1);
                //console.log('CODES', num, previous_code, next_code);

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
            //console.log("A TEST HTML", out_single);
            forEach(out_single.images, function(element, index) {

              if (element.transcriptions) {
                  forEach(element.transcriptions, function(trans, j) {
                    //console.log("Trans", j, trans);

                    out_single.images[index].transcriptions[j] =
                        angular.copy($sce.trustAsHtml(trans));
                    self.test = $sce.trustAsHtml(trans);

                  });
              }

              self.translations = {};
              if (element.translations) {
                self.translations = element.translations;
              }

            });

            self.data = out_single;
            self.load = false;

        }); // single data
      }); // steps
    } // END loadData FUNCTION

    // Use it
    loadData();
}

})();
