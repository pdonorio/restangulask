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

// REWRITE IMAGES and TRANSCRIPTIONS
            console.log("A TEST HTML", out_single);
            forEach(out_single.images, function(element, index) {
              forEach(element.transcriptions, function(trans, j) {
                console.log("Trans", j, trans);

out_single.images[index].transcriptions[j] = angular.copy($sce.trustAsHtml(trans));

self.test = $sce.trustAsHtml(trans);

              });
            });
            self.data = out_single;

        }); // single data
      }); // steps
    } // END loadData FUNCTION

    // Use it
    loadData();
}

})();
