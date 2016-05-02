(function() {
  'use strict';

angular.module('web')
    .controller('FastSearchController', FastSearchController)
    ;

function FastSearchController($scope, $log, SearchService
    //, $rootScope, $state, hotkeys, keyshortcuts
    )
{

  // INIT controller
  var self = this;
  $log.warn("New FAST search controller");

  self.searchTextChange = function (text) {
    $log.warn('Text changed to ' + text);
    if (text && text.trim() != '') {
        self.load(text);
    }
  }
  self.selectedItemChange = function (item) {
    //$log.warn('Item changed to ' + JSON.stringify(item));
    if (item && item.trim() != '') {
        self.load(item);
    }
  }

  self.querySearch = function (text) {

    var empty_response = [];

    if (!text || text.trim() == '')
        return empty_response;
    return SearchService.getSuggestionsFast(text).then(function (out) {
        console.log("OUT", out);
        if (out.elements && out.elements > 0)
            return out.data;
        return empty_response;
    });
  }


  self.load = function(searchTerms) {

      self.data = null;
      self.elements = -1;
      SearchService.getDataFast(searchTerms).then(function (out) {
           //console.log("TEST", out);
           self.data = out.data;
           self.elements = out.elements;
      });

  }

  // first call
  self.load();

}

})();