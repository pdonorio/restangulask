(function() {
  'use strict';

angular.module('web')
    .filter('len', getLength);

/* HOW TO USE THIS FILTER
filter:
<div ng-if="2 == ('foobar' | len )">
  Hello
</div>
*/

function getLength() {
   return function(object) {

      return Object.keys(object).length;
      /*
      Another working approach:
      var counter = 0
      angular.forEach(object, function(item) {
        counter++;
      });

      return counter;
      */
    };
}

})();