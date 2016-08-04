(function() {
  'use strict';

angular.module('web')
    .component('counter', {
      bindings: {
        count: '='
      },
      controller: function () {
        var self = this;
        console.log("TEST COMPONENT!", self.count);
      },
      template: function ($element, $attrs) {
        console.log('TEMPLATE', $element, $attrs);
        return `
            PAOLO!
            `;
      }

    });

})();