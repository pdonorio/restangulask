(function() {
  'use strict';

// // you might call this after your module initalization
// angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 250);

angular.module('web')
    .controller('FastSearchController', FastSearchController);

    //hotkeys, keyshortcuts,
function FastSearchController($scope, $log, $stateParams, $timeout,
    SearchService, $mdBottomSheet)
{

  // INIT controller
  var self = this;
  $log.warn("New FAST search controller");
  $mdBottomSheet.hide("search");

  ///////////////////////////
  // BASE data for advanced search
  self.base = {};
  self.advancedLoader = true;
  self.cookieKey = 'searchParameters';

  SearchService
    .getBaseSearchData().then(function (out) {
        self.base = out;
        self.advancedLoader = false;
        console.log('Obtained BASE', out);
    });

  self.searchTextChange = function (text) {
    $log.info('Text changed', text, self.searchText);
    // $scope.myadapter.reload(0);
    $scope.extraits = [];
    $scope.myPagingFunction();

    // $scope.$emit('list:filtered');
  }

  self.clearFilters = function() {
      self.filters = {};
      localStorage.removeItem(self.cookieKey);
      $stateParams.text = '';
      // self.searchTextChange();
  }

  ///////////////////////////
  // FILTERS

  if ($stateParams.clean) {
    console.log("Clean parameters");
    self.clearFilters();
  }

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

  self.elements = null;
  self.load = false;

  ///////////////////////////
  // HANDLE PARAMETER
  // self.searchText = $stateParams.text;
  //
  $scope.extraits = [];
  self.busy = false;

  $scope.myPagingFunction = function() {

    if (self.busy) return;
    self.busy = true;

    console.log("Infinite scroll activated", $scope.extraits.length);
    self.filters['searchText'] = self.searchText;
    localStorage.setItem(self.cookieKey, JSON.stringify(self.filters));

    SearchService.getDataFast(self.searchText, $scope.extraits.length+1, self.filters)
       .then(function (out) {
          // console.log('TEST', out.data, out.elements);
          if (out && out.elements) {
              // Search for lexique
              if (self.searchText.length > 2) {
                  self.checkLexique();
              }
              self.elements = null;
              if (out.elements) {
                self.elements = out.elements;
                console.log("Received", out.data);
                forEach(out.data, function(element, index) {
                    $scope.extraits.push(element);
                });
              }
          } else {
              self.elements = $scope.extraits.length;
          }
          self.busy = false;
      });
    // // NOT WORKING?
    // $scope.$emit('list:filtered');
  }

//////////////////
// TO BE REMOVED
  $scope.myadapter = {};
  $scope.datasource = {
    get : function (index, count, success)
    {
          // count = 7;
          $scope.rows = null;
          self.filters['searchText'] = self.searchText;
          localStorage.setItem(self.cookieKey, JSON.stringify(self.filters));
          console.log("GET ME:", index, count, self.searchText, self.filters);

          index--;
          if (index < 0) {
            count = count + index;
            index = 0;
            if (count <= 0) {
                console.log("UHM", index, count);
                success([]);
                return $timeout(function(){}, 100);
            }
          }

          console.log("DO SOMETHING", index, count);

          self.load = true;
          SearchService.getDataFast(self.searchText, index, self.filters)
           .then(function (out) {
              // console.log('TEST', out.data, out.elements);
              if (out && out.elements) {
                  // Search for lexique
                  if (self.searchText.length > 2) {
                      self.checkLexique();
                  }
                  self.elements = null;
                  if (out.elements) {
                    success(out.data);
                    self.elements = out.elements;
                  }
              } else {
                  self.elements = 0;
              }
          });
          self.load = false;
          return;
    }
  }
// TO BE REMOVED
//////////////////

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

  self.selectedItemChange = function (item) {
    if (item && item.trim() != '') {
        $log.info('Item changed to ' + JSON.stringify(item));
        self.searchText = item;
        self.searchTextChange(item);
    }
  }

  self.checkLexique = function () {
    // console.log("CHECK LEX");
    $scope.rows = null;
    $scope.selected = self.searchText;
    $scope.fields = [
        'sheet', 'macro', 'micro',
        'titre', 'latin', 'français', 'italiano'
    ];
    // console.log("TEST", selection);

    SearchService.getFastLex(self.searchText)
      .then(function(out){
          if (out && out.elements) {
            if (out.elements > 0) {
                console.log("OUT", out);
                $scope.rows = out.data;
            }
          }
    });
  }

  ///////////////////////////////////////
  // FINAL INIT

  // if ($stateParams.clean) {
  //   console.log("Clean parameters");
  //   self.clearFilters();
  // }

  if ($stateParams.text) {
      self.searchText = $stateParams.text;
      console.log("Search parameter", self.parameter);
  }

  console.log("Start with", self.filters);

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