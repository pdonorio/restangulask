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
    template: '<input type="text" '+
              ' ng-model="model[options.key]" '+
              ' ng-model-options="{ getterSetter: true }"'+
              ' uib-typeahead="item as item.name for item in ctrl.querySearch(options.key, $viewValue)"'+
              ' typeahead-select-on-blur=true'+
              ' typeahead-show-hint=true'+
              ' class="form-control"'+
              '>',
    wrapper: ['bootstrapLabel', 'bootstrapHasError'],

  });

}
