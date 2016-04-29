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
  }
  self.selectedItemChange = function (item) {
    $log.warn('Item changed to ' + JSON.stringify(item));
  }
  self.querySearch = function (text) {
       return [
            {name: 'hello', watchers: '12', forks: 'qualcosa'},
            {name: 'a hel world', watchers: '12', forks: 'qualcosa'},
       ];
  }

  SearchService.getDataFast().then(function (out) {
       console.log("TEST", out);
       self.data = out.data;
  });

}

})();