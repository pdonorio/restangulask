(function() {
  'use strict';

angular.module('web')
    .controller('DetailsController', DetailsController);

function DetailsController($scope, $log, $sce, $stateParams, SearchService)
{
    $log.info("Single view on", $stateParams.id);
    var self = this;
    self.data = null;

    function loadData() {

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
              $scope.showSimpleToast("No data found for current id!");
              return false;
            }

            // Set data
            var tmp = angular.copy(out_single);
            delete tmp.id;
            delete tmp.thumb;
            delete tmp.images;
            self.refinedData = tmp;

            ////////////////////////////////////
            ////////////////////////////////////
            // FIND NAMES, and previous and next
            var
                field = "Numero de l'extrait",
                codes = out_single['Extrait'][field].split('_'),
                prefix = codes[0],
                num = parseInt(codes[1]),
                previous_code = prefix + "_" + String(num - 1),
                next_code = prefix + "_" + String(num + 1);

// OPTIMIZE:
// http://stackoverflow.com/q/28835512/2114395
// https://www.rethinkdb.com/docs/secondary-indexes/python/#multi-indexes
            // SEARCH WITH APIs
            self.previous.text = previous_code;
            SearchService.recoverCode(previous_code, field).then(function (out)
            {
                //$log.warn("OUT PREV IS", out);
                if (out.elements && out.elements > 0) {
                    self.previous.link = out.data[0].record;
                }
            });
            self.next.text = next_code;
            SearchService.recoverCode(next_code, field).then(function (out)
            {
                if (out.elements && out.elements > 0) {
                    self.next.link = out.data[0].record;
                }
                $log.warn("Link avaialble")
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
            });

            self.data = out_single;

        }); // single data
      }); // steps
    } // END loadData FUNCTION

    // Use it
    loadData();
}

})();
