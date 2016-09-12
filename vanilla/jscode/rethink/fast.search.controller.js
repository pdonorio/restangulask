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
  self.elements = 0;
  self.filters = {};

/* LOAD ADVANCED AT STARTUP

  var promises = {
    fete: SearchService.getDistinctValuesFromStep(3),
    2: SearchService.getDistinctValuesFromStep(2),
  }
  $q.all(promises).then((values) =>
  {
    forEach(values, function (api_response, step) {
      if (api_response.elements > 2) {
      }
    });
  });

*/

  SearchService.getDistinctValuesFromStep(3).then(function (out) {
    if (out.elements && out.elements > 0) { self.fetes = out.data; }
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
          var result = [];
          if (index > 0) {
              SearchService.getDataFast(self.searchText, index, self.filters)
               .then(function (out) {
                  // console.log('TEST', out.data, out.elements);
                  self.elements = 0;
                  if (out.elements) {
                    self.elements = out.elements;
                  }
                  success(out.data);
              });
          } else {
            success([]);
          }
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
  self.searchText = $stateParams.text;
  console.log("Search parameter", self.parameter);

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