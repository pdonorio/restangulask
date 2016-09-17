(function() {
  'use strict';

angular.module('web')
    .controller('FastSearchController', FastSearchController);

function FastSearchController(
    $scope, $log, $stateParams,
    //hotkeys, keyshortcuts,
    SearchService)
{

  // INIT controller
  var self = this;
  $log.warn("New FAST search controller");

  ///////////////////////////
  ///////////////////////////
  // FILTERS
  $scope.advanced = false;
  self.elements = null;
  self.filters = {};
  self.load = false;

/* // LOAD ADVANCED AT STARTUP

  // var promises = {
  //   fete: SearchService.getDistinctValuesFromStep(3),
  //   2: SearchService.getDistinctValuesFromStep(2),
  // }
  $q.all(promises).then((values) =>
  {
    forEach(values, function (api_response, step) {
      if (api_response.elements > 2) {
      }
    });
  });

*/

// TO FIX
// MAKE ONE ENDPOINT

//promise 1
  SearchService
    .getDistinctValuesFromMultiStep(6)
    .then(function (out) {
      if (out && out.elements && out.elements > 0) { self.apparatos = out.data; }
//promise 2.1
      SearchService
        .getDistinctValuesFromStep(2)
        .then(function (out) {
          if (out && out.elements && out.elements > 0) { self.sources = out.data; }
//promise 3.1
          SearchService
            .getDistinctValuesFromStep(2, 2)
            .then(function (out) {
              if (out && out.elements && out.elements > 0) { self.manuscrits = out.data; }
          });
        });
//promise 2.2
      SearchService
        .getDistinctValuesFromStep(3)
        .then(function (out) {
          if (out && out.elements && out.elements > 0) { self.fetes = out.data; }
//promise 3.2
          SearchService
            .getDistinctValuesFromStep(3, 5)
            .then(function (out) {
              if (out && out.elements && out.elements > 0) { self.lieus = out.data; }
          });
      });
  });


  ///////////////////////////
  ///////////////////////////

  // HANDLE PARAMETER
  // self.searchText = $stateParams.text;

  $scope.myadapter = {};
  $scope.datasource = {
    get : function (index, count, success)
    {
// do something with filters?
          console.log("GET ME:", index, count, self.searchText, self.filters);
          self.load = true;
          var result = [];
          if (index > 0) {
              SearchService.getDataFast(self.searchText, index, self.filters)
               .then(function (out) {
                  // console.log('TEST', out.data, out.elements);
                  console.log("TEST 1");
                  if (out && out.elements) {
                      self.elements = null;
                      if (out.elements) {
                        success(out.data);
                        self.elements = out.elements;
                      }
                  } else {
                      self.elements = 0;
                  }
                  console.log("TEST 2");
              });
          } else {
            console.log("Empty search");
            success([]);
          }
          self.load = false;
    }
  }

  self.querySearch = function (text) {

    var empty_response = [];
    if (!text || text.trim() == '')
        return empty_response;

    return SearchService.getSuggestionsFast(text).then(function (out) {
        //console.log("OUT", out);
        if (out.elements && out.elements > 0)
            return out.data;
        return empty_response;
    });
  }

  self.searchTextChange = function (text) {
    $log.info('Text changed', text, self.searchText);
    $scope.myadapter.reload(0);
  }

  self.selectedItemChange = function (item) {
    if (item && item.trim() != '') {
        $log.info('Item changed to ' + JSON.stringify(item));
        self.searchText = item;
        self.searchTextChange(item);
    }
  }

  // first call (based on the URL)
  if ($stateParams.text) {
      self.searchText = $stateParams.text;
      console.log("Search parameter", self.parameter);
  }

/*
  // Init keys
  hotkeys.bindTo($scope)
    .add({
        combo: "esc",
        description: "Quit from searching",
        callback: function() { keyshortcuts.exitSearch(event, self); }
  });
*/

};

})();