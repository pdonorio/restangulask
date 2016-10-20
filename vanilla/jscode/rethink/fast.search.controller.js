(function() {
  'use strict';

angular.module('web')
    .controller('FastSearchController', FastSearchController);

    //hotkeys, keyshortcuts,
function FastSearchController($scope, $log, $stateParams, $timeout, SearchService)
{

  // INIT controller
  var self = this;
  $log.warn("New FAST search controller");

  ///////////////////////////
  // FILTERS
  self.cookieKey = 'searchParameters';
  $scope.advanced = false;
  var filtersKey = ['fete', 'source', 'lieu', 'manuscrits', 'apparato', 'actions', 'temps'];
  // local storage / cookie
  self.filters = JSON.parse(localStorage.getItem(self.cookieKey));

  if (self.filters) {
    if (self.filters.searchText)
      self.searchText = self.filters.searchText;
    forEach(filtersKey, function(val, key){
        if (self.filters[val])
          $scope.advanced = true;
    });
  } else {
    self.filters = {};
  }

  console.log("Start with", self.filters);
  self.elements = null;
  self.base = {};
  self.load = false;

  self.clearFilters = function() {
      self.filters = {};
      localStorage.removeItem(self.cookieKey);
      self.searchTextChange();
  }

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
          self.filters['searchText'] = self.searchText;
          self.load = true;
          localStorage.setItem(self.cookieKey, JSON.stringify(self.filters));
          console.log("GET ME:", index, count, self.searchText, self.filters);

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

  self.cloneDate = function () {
    if (self.filters.start_date && !self.filters.end_date) {
        self.filters.end_date = self.filters.start_date;
    } else if (self.filters.end_date && !self.filters.start_date) {
        self.filters.start_date = self.filters.end_date;
    }
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