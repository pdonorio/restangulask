(function() {
'use strict';

angular.module('web')
 .constant('rethinkRoutes',

// EXTRA ROUTES
    {

    ////////////////////// NEW
        'public.fastsearch': {
            url: "/fastsearch/:text",
            views: {
                "unlogged": {
                    dir: 'blueprint',
                    templateUrl: 'fastsearch.html',
                }
            },
            // onEnter: function ($rootScope) {
            //     $rootScope.avoidTheToolbar = true;
            // },
            // onExit: function ($rootScope) {
            //     $rootScope.avoidTheToolbar = false;
            // },
        },

    ////////////////////// OLD
        'public.specialsearch': {
            url: "/search/:text",
            views: {
                "unlogged": {
                    dir: 'blueprint',
                    templateUrl: 'search.html',
                }
            },
            onEnter: function ($rootScope) {
                $rootScope.avoidTheToolbar = true;
            },
            onExit: function ($rootScope) {
                $rootScope.avoidTheToolbar = false;
            },
        },

    //////////////////////
        'public.db': {
            url: "/db",
            views: {
                "unlogged": {
                    dir: 'blueprint',
                    templateUrl: 'basedonne.html',
                }
            }
        },

    //////////////////////
        'public.expo': {
            url: "/expo",
            views: {
                "unlogged": {
                    dir: 'blueprint',
                    templateUrl: 'expo_fork.html',
                }
            }
        },

    //////////////////////
        'public.expo.themes': {
            url: "/themes",
            views: {
                "test": {
                    dir: 'blueprint',
                    templateUrl: 'expo_themes.html',
                }
            }
        },

    //////////////////////
        'public.expo.themes.selected': {
            url: "/:section",
            views: {
                "themes": {
                    dir: 'blueprint',
                    templateUrl: 'expo_section.html',
                }
            }
        },

    //////////////////////
        'public.expo.themes.selected.theme': {
            url: "/:theme",
            views: {
                "themes@public.expo.themes": {
                    dir: 'blueprint',
                    templateUrl: 'expo_theme.html',
                }
            }
        },

    //////////////////////
        'public.list': {
            url: "/list",
            views: {
                "unlogged": {
                    dir: 'blueprint',
                    templateUrl: 'steplist.html',
                }
            }
        },

    //////////////////////
        'public.details': {
            url: "/details/:id?query",
            views: {
                // "menu": {
                //     dir: 'template',
                //     templateUrl: 'menu.html',
                // },
                "unlogged": {
                    dir: 'blueprint',
                    templateUrl: 'details.html',
                }
            }
        },

/* Much easier if it's on python template
    //////////////////////
        'logged.zoom': {
            url: "/zoom/:id",
            views: {
                "loggedview": {
                    dir: 'blueprint',
                    templateUrl: 'zoom.html',
                }
            }
        },
*/

    //////////////////////
        'logged.explore': {
            url: "/explore",
            views: {
                "loggedview": {
                    dir: 'blueprint',
                    templateUrl: 'explore.html',
                }
            },
        },
    //////////////////////
        'logged.submission': {
            url: "/create",
            views: {
                "loggedview": {
                    dir: 'blueprint',
                    templateUrl: 'submit.html',
                }
            },
        },

    //////////////////////
        'logged.admin': {
            url: "/admin/:tab?new",
// TO FIX:
// ONLY ADMIN ROLE IS ALLOWED
            views: {
                "loggedview": {
                    dir: 'blueprint',
                    templateUrl: 'admin.html',
                }
            },
/*
            onEnter: function ($rootScope) {
              $rootScope.toolbarColor = 'red darken-4';
            },
            onExit: function ($rootScope) {
              $rootScope.toolbarColor =
                angular.copy($rootScope.originalColor);
            },
*/
        },

    //////////////////////

    }

 ); // END CONSTANT

})();
