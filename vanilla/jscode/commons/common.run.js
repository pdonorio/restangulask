(function() {
  'use strict';

angular.module('web')

/* Boost performance!
http://www.gros-engineering.com/angularjs-performance-tweaks/
*/

    .config(['$compileProvider', function ($compileProvider) {
      $compileProvider.debugInfoEnabled(false);
    }])


    .config(function ($mdThemingProvider) {

/* UHM
// angular material palette
// Note: default is grey, not cool
        $mdThemingProvider.theme('white');
        $mdThemingProvider.setDefaultTheme('white');
*/

// WTF
        var background = $mdThemingProvider.extendPalette('grey', {
          '50': 'ffffff',
          //'A100': 'ffffff'
        });
        $mdThemingProvider.definePalette('background', background);

        $mdThemingProvider
            //.theme('indigo')
            .theme('default')
            // .primaryPalette('indigo')
            // .accentPalette('pink')
            // .warnPalette('red')
            // .backgroundPalette('grey'
            //     , {
            //     'default': '50',
            //     'hue-1': '300',
            //     'hue-2': '600',
            //     'hue-3': '900'
            //  }
            //  );
            //.light();
            .backgroundPalette('background');
    });

// DISABLE THE MAIN RUN above
//angular.module('web').run(runBlock);

function runBlock($log,
    $rootScope, $cacheFactory, $templateCache, $urlRouter,
    editableOptions, editableThemes, formlyConfig
    )
{
	$log.debug('Run the app :)');

/*
// Issue of state.current.name empty on refresh:
// http://stackoverflow.com/a/29943256
    // Once the user has logged in, sync the current URL
    // to the router:
     $urlRouter.sync();
    // Configures $urlRouter's listener *after* your custom listener
    $urlRouter.listen();
*/

/*
    // SPECIFIC FOR UI ROUTER
    // Execute every time a state change begins
    $rootScope.$on('$stateChangeSuccess',
        function (event, toState, toParams, fromState, fromParams) {
            // If the state we are headed to has cached template views
            if (typeof (toState) !== 'undefined'
                && typeof (toState.views) !== 'undefined') {
                // Loop through each view in the cached state
                for (var key in toState.views) {
                    // Delete templeate from cache
                    $log.debug("Delete cached template: " + toState.views[key].templateUrl);
                    $cacheFactory.get('templates')
                        .remove(toState.views[key].templateUrl);
                }
            }
        });
*/
}

})();
