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
  self.base = {};
  self.load = false;

  ///////////////////////////
  // BASE data for advanced search
  SearchService
    .getBaseSearchData().then(function (out) {
        self.base = out;
        console.log('BASE', out);
    });


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
                  if (out && out.elements) {
                      self.elements = null;
                      if (out.elements) {
                        success(out.data);
                        self.elements = out.elements;
                      }
                  } else {
                      self.elements = 0;
                  }
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