angular.module('web').config(hotkeysConfig);
angular.module('web').config(formlyConfig);

function hotkeysConfig(hotkeysProvider) {
  //Disable ngRoute integration to prevent listening for $routeChangeSuccess events
  hotkeysProvider.useNgRoute = false;
}

function formlyConfig(formlyConfigProvider) {
  // self.templateDir+'/show.formly.html',
  //Custom template for autocomplete fields
  formlyConfigProvider.setType({
    name: 'autocomplete',
    extends: 'input',
    // controller: 'AutocompleteController as ctrl',
    // templateUrl: templateDir+'show.formly.html'
    template: '<md-autocomplete '+
              // 'ng-model="model[options.key]"'+
              'md-selected-item="model[options.key]"'+
              'md-search-text="ctrl.searchText"'+
              'md-items="item in ctrl.querySearch(ctrl.searchText)"'+
              'md-item-text="item.name"'+
              'md-min-length="0"'+
              'placeholder="{{options.templateOptions.placeholder}}"'+
              '>'+
              '<md-item-template>'+
              '<span md-highlight-text="ctrl.searchText" md-highlight-flags="^i">{{item.name}}</span>'+
              '</md-item-template>'+
              '<md-not-found>'+
              '  No matching found for "{{ctrl.searchText}}"'+
              ' - <a ng-click="ctrl.newElement(ctrl.searchText)">create a new element</a>'+
              '</md-not-found>'+
              '</md-autocomplete>'
  });

  //Custom template for Bootstrap autocomplete fields
  formlyConfigProvider.setType({
    name: 'typeahead',
    controller: 'AutocompleteController as ctrl',
    template: '<input type="text" ng-model="model[options.key]" uib-typeahead="item for item in to.options | filter:$viewValue | limitTo:8" class="form-control">',
    wrapper: ['bootstrapLabel', 'bootstrapHasError'],
  });

}
