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
  self.elements = null;
  $log.warn("New FAST search controller");
  $mdBottomSheet.hide("search");

  ///////////////////////////
  // http://stackoverflow.com/a/37826964/2114395
  self.setFocus=function() {
    setTimeout(function() {
        console.log("Trying to focus");
        document.querySelector('#autoCompleteId').focus();
    },100);
  }

  ///////////////////////////
  // BASE data for advanced search
  self.base = {};
  self.advancedLoader = true;
  self.cookieKey = 'searchParameters';

  SearchService
    .getBaseSearchData().then(function (out) {
        self.advancedLoader = false;
        console.log('Base', out);
        if (out) {
          self.base = out;
        } else {
          console.log("UHM");
          self.elements = 0;
        }
    });

  ///////////////////////////
  // FILTERS

  $scope.advanced = false;
  var filtersKey = [
    'fete', 'source', 'lieu', 'manuscrits',
    'apparato', 'actions', 'temps'
  ];
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
  // console.log("current filters", self.filters);

  self.load = false;

  ///////////////////////////
  // HANDLE PARAMETER
  // self.searchText = $stateParams.text;
  //
  self.extraits = {

    stop_: false,
    hold: false,
    numLoaded_: 0,
    toLoad_: 0,
    items: [],

    refresh: function() {
        this.stop_ = false;
        this.hold = false;
        this.numLoaded_ = 0;
        this.toLoad_ = 0;
        this.items = [];
    },

    getItemAtIndex: function (index) {
        if (!this.hold) {
            if (index > this.numLoaded_) {
                this.fetchMoreItems_(index);
                return null;
            }
        }
        return this.items[index];
    },

    getLength: function () {
        if (this.stop_) {
            return this.items.length;
        }
        return this.numLoaded_ + 5;
    },

    fetchMoreItems_: function (index) {
        if (this.toLoad_ < index) {

            this.hold = true;
            this.toLoad_ += 5;
            var start = this.numLoaded_;
            if (start > 0) start++;

            // console.log("Saving search", self.filters);
            // Save filters
            self.filters['searchText'] = self.searchText;
            localStorage.setItem(self.cookieKey, JSON.stringify(self.filters));

            // Search for lexique
            if (self.searchText.length > 2) {
                self.checkLexique();
            }

            SearchService.getDataFast(self.searchText, start, self.filters)
            .then(angular.bind(this, function (obj) {

              if (obj && obj.elements > 0) {
                self.elements = obj.elements;

                // console.log('Data fast:', obj.data, obj.elements);
                this.items = this.items.concat(obj.data);

                if (obj.elements < this.toLoad_) {
                    this.stop_ = true;
                    // console.log("Should stop");
                }
                this.numLoaded_ = this.items.length;
                this.hold = false;
              } else {
                self.elements = 0;
              }
            }));
        }
    }
  }

  self.searchTextChange = function (text) {
    $log.info('Text changed', text, self.searchText);
    // RELOAD
    self.extraits.refresh();
  }

  self.clearFilters = function() {
      self.filters = {};
      localStorage.removeItem(self.cookieKey);
      $stateParams.text = '';
      self.searchText = null;
      // RELOAD
      self.extraits.refresh();
  }

  if ($stateParams.clean) {
    console.log("Clean parameters");
    self.clearFilters();
  }
  self.setFocus();

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
    $scope.rows = null;
    $scope.selected = self.searchText;
    $scope.fields = [
        'sheet', 'macro', 'micro',
        'titre', 'latin', 'français', 'italiano'
    ];
    console.log("CHECK LEX", $scope.selected);

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