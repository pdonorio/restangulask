(function() {
'use strict';

// EXTRA ROUTES
angular.module('web').constant('rethinkRoutes', {

/* TO BE REMOVED...
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
     // Much easier if it's on python template
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
*/

    // 'logged.fastsearch': {
    'logged.fastsearch': {
        url: "/fastsearch/:text?clean",
        views: {
            // "unlogged": {
            "loggedview": {dir: 'blueprint', templateUrl: 'fastsearch.html'}
        },
        // onEnter: function ($rootScope) {
        //     $rootScope.avoidTheToolbar = true;
        // },
        // onExit: function ($rootScope) {
        //     $rootScope.avoidTheToolbar = false;
        // },
    },
    //////////////////////
    'logged.details': {
        url: "/details/:id?query",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'details.html'}
        }
    },
    //////////////////////
    'logged.submit': {
        url: "/submit/:id?step",
        views: {
            "loggedview": {
                dir: 'blueprint', template: '<formfarm> loading </formfarm>'}
        }
    },
    //////////////////////
    'logged.remove': {
        url: "/remove/:id",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'remove_record.html'}
        },
    },
    //////////////////////
    'logged.actions': {
        url: "/manage",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'operations.html'}
        },
    },
    //////////////////////
    'logged.accounts': {
        url: "/accounts",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'accounting.html'}
        },
    },
    //////////////////////
    'logged.explore': {
        url: "/explore",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'explore.html'}
        },
    },
    //////////////////////
    'logged.backups': {
        url: "/backups",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'dbbackups.html'}
        },
    },
    //////////////////////
    'logged.corrupted': {
        url: "/broken",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'broken_images.html'}
        },
    },
    //////////////////////
    'logged.date': {
        url: "/date/:fetepos",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'date.html'}
        },
    },
    //////////////////////
    'logged.admin': {
        url: "/admin/:tab?new",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'admin.html'}
        },
    },

/*
    //////////////////////
        'public.lex': {
            url: "/lexique",
            views: {
                "unlogged": {
                    dir: 'blueprint',
                    templateUrl: 'lexique.html',
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

        'public.expo.pieces': {
            url: "/_all",
            views: {
                "test": {
                    dir: 'blueprint',
                    templateUrl: 'expo_all.html',
                }
            }
        },

        'public.expo.pieces.image': {
            url: "/:position",
            views: {
                "images@public.expo.pieces": {
                    dir: 'blueprint',
                    //templateUrl: 'expo_only_image.html',
                    templateUrl: 'expo_image.html',
                }
            }
        },

        'public.expo.themes': {
            url: "/themes",
            views: {
                "test": {
                    dir: 'blueprint',
                    templateUrl: 'expo_themes.html',
                }
            }
        },

        'public.expo.themes.selected': {
            url: "/:section",
            views: {
                "themes": {
                    dir: 'blueprint',
                    templateUrl: 'expo_section.html',
                }
            }
        },

        'public.expo.themes.selected.theme': {
            url: "/:theme",
            views: {
                "themes@public.expo.themes": {
                    dir: 'blueprint',
                    templateUrl: 'expo_theme.html',
                }
            }
        },

        'public.expo.themes.selected.theme.image': {
            url: "/:element",
            views: {
                "themes@public.expo.themes": {
                    dir: 'blueprint',
                    templateUrl: 'expo_image.html',
                }
            }
        },

    //////////////////////
        'public.list': {
            url: "/list?name&book",
            params: {
                name: {
                    value: '~',
                    // avoid showing in URL when value is default. cool
                    squash: true
                },
                book: {
                    value: null,
                    squash: true
                }
            },
            views: {
                "unlogged": {
                    dir: 'blueprint',
                    templateUrl: 'steplist.html',
                }
            }
        },
*/

  }

); // END CONSTANT

})();
