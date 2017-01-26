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

    // RELOAD?

    // VERY OLD
    // $scope.myadapter.reload(0);

    // OLD
    // $scope.extraits = [];
    // $scope.myPagingFunction();
    // $scope.$emit('list:filtered');

    // NEW
    self.extraitsLoop.refresh();
    // self.loadMore(0);
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

  ///////////////////////////
  self.extraits = []
  self.extraitsLoop = {
    numLoaded_: 0,
    toLoad_: 0,

    getItemAtIndex: function(index) {
      // console.log("MD VR: Getting", index);
      if (index > this.numLoaded_) {
        this.fetchMoreItems_(index, this);
        // console.log("MD VR: loaded", this.numLoaded_, this.toLoad_);
        return null;
      }
      return index;
    },

    // For infinite scroll behavior, we always return a slightly higher
    // number than the previously loaded items.
    getLength: function() {
      return this.numLoaded_ + 5;
    },

    refresh : function() {
        this.toLoad_ = 0;
        this.numLoaded_ = 0;
        self.extraits = [];
        // this.items = [];
    },

    fetchMoreItems_: function(index, reference) {

        if (this.toLoad_ < index) {
          console.log("MD VR: More", index);
          this.toLoad_ += 10;

          self.loadMore(this.numLoaded_).then(function(elements) {
            console.log("Obtained", elements);
            reference.numLoaded_ = reference.toLoad_;
          });

        }

    }
  };

  self.loadMore = function(start) {

    // Note: loading 10 at the time

    self.filters['searchText'] = self.searchText;
    localStorage.setItem(self.cookieKey, JSON.stringify(self.filters));

    return SearchService.getDataFast(
      self.searchText, start, self.filters).then(
        function (out) {
          // console.log('Data fast:', out.data, out.elements);
          if (out && out.elements) {
              self.elements = null;

              // // Search for lexique
              // if (self.searchText.length > 2) {
              //     self.checkLexique();
              // }

              if (out.elements) {
                self.elements = out.elements;
                forEach(out.data, function(element, index) {
                    self.extraits.push(element);
                });
                console.log("Received", out.data);
              }
          } else {
              self.elements = self.extraits.length;
          }
          console.log("Total", self.extraits);
          return self.elements;
        });
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