(function() {
  'use strict';

angular
    .module('web')
    .controller('SideMenuController', SideMenuController);

function SideMenuController($scope, $rootScope, $log, $timeout, $state)
{
    var self = this;
    $log.warn("Menu");

    self.links = [
        { name: 'bienvenue',
            section: 'Projet',
            link: 'welcome.subsection', cls: null, extra: {}},
        { name: 'base de données',
            section: 'Base de données',
            link: 'public.db', cls: null, extra: {}},
        {
            name: 'exposition',
            section: 'Exposition',
            cls: null,
            link: "public.expo", extra: {}
            // link: "welcome.more",
            // extra: {section_type: 'welcome', element: 2}
        },
        {
            name: 'lexique',
            section: 'Lexique',
            link: "public.lex",
            // link: "welcome.more",
            cls: null,
            extra: {}
            // extra: {section_type: 'welcome', element: 3}
        },
    ];

    self.go = function (link, extra) {
        //console.log("LINK", link, extra);
        if (extra)
            $state.go(link, extra);
        else
            $state.go(link);
    }

    self.changeTo = function(sectionName) {
        console.log('Section', sectionName);
        forEach(self.links, function(value, key){
            console.log("UHM", value, value.section);
            if (value.section == sectionName) {
                $state.go(value.link, value.extra);
            }
        });
    }

    $rootScope.$on('$stateChangeSuccess',
      function (event, toState, toParams, fromState, fromParams) {
        // Enable current page
        forEach(self.links, function(element, index) {

            self.links[index].cls = null;

            if ($rootScope.lastRoute &&
                $rootScope.lastRoute.state.name == element.link) {

                var active = true;
                if (Object.keys($rootScope.lastRoute.params).length > 0) {

                  forEach($rootScope.lastRoute.params, function(param, key) {

                    //console.log("Uhm", element, param, key);
                    if (element.extra.hasOwnProperty(key)) {
                        if (param != element.extra[key]) {
                            active = false;
                        }
                    } else {
                        active = false;
                    }

                  });

                }

                if (active)
                    self.links[index].cls = 'active';
            }
        });
    });
}

})();