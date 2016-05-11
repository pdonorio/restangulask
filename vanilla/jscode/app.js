(function() {
  'use strict';

/* Define another module?
console.log('PRE');
angular.module('blueprint', ['ui.router']);
console.log('POST');
*/

  angular
    .module('web', [
// BASE
        //'ngAnimate',
        'ngSanitize',
// ROUTING
        'ui.router', //'ngRoute',
// BOOTSTRAP
        //'mgcrea.ngStrap',
// OFFICIAL MATERIAL
        'ngMaterial',
// MATERIAL DESIGN
        'ui.materialize',
// AUTH
        'satellizer',

//////////////////////////////////////
/* Custom */

// THE LOADING BAR
        //'angular-loading-bar',
        //'cfp.loadingBar',
// IMAGES LAZ LOAD
        'angularLazyImg',
// MAKE DATA TREE explorer
        'treeControl',
// KEYBOARD SHORTCUTS
        'cfp.hotkeys',
// DRAG AND DROP
        'angular-sortable-view',
// FORMS FROM JSON SCHEMAS
        'formly',
        'formlyMaterial',
// EDITABLE FORMS
        //'xeditable',
// RESTARTABLE UPLOAD
        'flow',
// text editor
        'ui.tinymce',
// infinite (bi-directional) scrolling
        'ui.scroll',

/* Custom end */
//////////////////////////////////////

    ])

/*
// CHECK SANITIZER:
// http://odetocode.com/blogs/scott/archive/2014/09/10/a-journey-with-trusted-html-in-angularjs.aspx
.config(function($provide){
    $provide.decorator("$sanitize", function($delegate, $log){
        return function(text, target){

            var result = $delegate(text, target);
            $log.info("$sanitize input: " + text);
            $log.info("$sanitize output: " + result);

            return result;
        };
    });
})
*/

    ;

})();
