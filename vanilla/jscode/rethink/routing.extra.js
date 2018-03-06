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
*/
    //////////////////////
    'logged.lex': {
        url: "/lexique",
        views: {
            "loggedview": { dir: 'blueprint', templateUrl: 'lexique.html' }
        }
    },

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
    'logged.chart': {
        url: "/map",
        views: {"loggedview": {dir: 'blueprint', templateUrl: 'map.html'}},
    },
    //////////////////////
    'logged.help': {
        url: "/help",
        views: {"loggedview": {dir: 'blueprint', templateUrl: 'help.html'}},
    },
    //////////////////////
    'logged.actions': {
        url: "/manage",
        views: { "loggedview": {dir: 'blueprint', templateUrl: 'operations.html'}
        },
    },
    //////////////////////
    'logged.uncomplete': {
        url: "/uncomplete",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'uncomplete.html'}
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
    'logged.tedit': {
        url: "/tedit",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'fixtrans.html'}
        },
    },
    //////////////////////
    'logged.iedit': {
        url: "/iedit",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'fiximages.html'}
        },
    },
/*
    //////////////////////
    'logged.explore': {
        url: "/explore",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'explore.html'}
        },
    },
*/
    //////////////////////
    'logged.backups': {
        url: "/backups",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'dbbackups.html'}
        },
    },
    //////////////////////
    'logged.lexdmin': {
        url: "/lexorg",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'lexique_admin.html'}
        },
    },
    //////////////////////
    'logged.fieldsadmin': {
        url: "/stepsorg",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'fields_admin.html'}
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
    'logged.expo': {
        url: "/expo",
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'expo_fork.html'}
        }
    }, 'logged.expo.pieces': {
        url: "/_all",
        views: {
            "test": {dir: 'blueprint', templateUrl: 'expo_all.html'}
        }
    }, 'logged.expo.pieces.image': {
        url: "/:position",
        views: {
            "images@logged.expo.pieces": {
                dir: 'blueprint', templateUrl: 'expo_image.html'}
        }
    }, 'logged.expo.themes': {
        url: "/themes",
        views: {
            "test": {dir: 'blueprint', templateUrl: 'expo_themes.html'}
        }
    }, 'logged.expo.themes.selected': {
        url: "/:section",
        views: {
            "themes": {dir: 'blueprint', templateUrl: 'expo_section.html'}
        }
    }, 'logged.expo.themes.selected.theme': {
        url: "/:theme",
        views: {
            "themes@logged.expo.themes": {
                dir: 'blueprint', templateUrl: 'expo_theme.html'}
        }
    }, 'logged.expo.themes.selected.theme.image': {
        url: "/:element",
        views: {
            "themes@logged.expo.themes": {
                dir: 'blueprint', templateUrl: 'expo_image.html'}
        }
    },
*/
    //////////////////////
    'logged.list': {
        url: "/list?name&book",
        params: {
            // squash: avoid showing in URL when value is default. cool
            name: { value: '~', squash: true },
            book: { value: null, squash: true }
        },
        views: {
            "loggedview": {dir: 'blueprint', templateUrl: 'steplist.html'}
        }
    },
  }

); // END CONSTANT

})();
