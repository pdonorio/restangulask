(function() {
  'use strict';

angular.module('web')
    .controller('AdminController', AdminController)
    .controller('WelcomeController', WelcomeController)
    .controller('WelcomeInfoController', WelcomeInfoController)
    .controller('DialogController', DialogController)
    .controller('TreeController', TreeController)
    ;

var
    data_type = 'welcome',
    slide_type = 'slides',
    mysection = 'admin_sections';

// General purpose load data function
// To use only inside controllers
function getSectionData($scope, AdminService)
{

    //SHOULD GET SLIDES TOO!

    //Recover sections
    return AdminService.getData(data_type).then(function (out)
    {

    // IF DATA IS PRESENT
      if (out !== null
        && out.hasOwnProperty('elements'))
      {
// TO DO:
        //Load images: datadocs with type=welcome

        //Preserve order
        var newdata = [];
        if (out.elements > 0) {
            for (var x = 0; x < out.data.length; x++) {
                newdata[x] = {};
            };
            forEach(out.data, function (element, j) {
                //console.log("TEST ME", element);
                if (element && element != '') {
                    var index = element.data['Position'];
                    newdata[index] = element;
// Do somthehing with images?
                    console.log("images", element.images);
                }
            });
            // VERIFY if some sections are missing
            for (var x = 0; x < newdata.length; x++) {
                if (!newdata[x]) {
                    newdata[x] = {'data': {
                        'Section': null,
                        'Position': null,
                    }};
                }
            }
        }
        $scope.sections = angular.copy(newdata); // out.data;

    // IF DATA MISSING!
      } else {
        $scope.sections = [{
            data: {
                "Section": "Temporary failure",
                "Description":
                    "Dear User,<br>" +
                    "currently our data server is unreachable." +
                    "<br><br>Please try again in a few minutes;" +
                    "<br>We apologize for any inconvenience."
                    ,
                "Content": "",
            },
            images: {}
        }]
      }
    });
};


function WelcomeInfoController($scope, $log, $stateParams,
    AdminService)
{
    $log.debug("Welcome info", $stateParams);
    var self = this;
    self.title = "None";
    self.moreContent = "No section selected";
    getSectionData($scope, AdminService).then(function() {
        var section = $scope.sections[$stateParams.section];
        self.title = section.data['Section'];
        self.moreContent = section.data['Content'];
    });

};

function WelcomeController($scope,
        $rootScope, $timeout, $log,
        AdminService,
        $state, $stateParams,
        $mdMedia, $mdDialog, $q)
{
  $log.debug("Welcome admin controller", $stateParams);
  var self = this;

  self.fixPositions = function (position) {
    var count = 0;
    var newSections = [];

    // Fix
    forEach($scope.sections, function(element, index) {
        if (element.data) {
            newSections[count++] = element;
        }
    });
    $scope.sections = angular.copy(newSections);
    $log.debug("Fixed sections");

    // Push and reload
    $rootScope.loaders[mysection] = true;
    self.resort(true).then(function () {
        getSectionData($scope, AdminService).then(function () {
            // Activate the view
            $timeout(function () {
                $rootScope.loaders[mysection] = false;
            }, timeToWait)
        });
    });
  }

  self.resort = function (skipReload)
  {
    if (!skipReload) {
        $rootScope.loaders[mysection] = true;
    }
    var promises = [];
    //console.log("TEST SECTIONS", $scope.sections);

    // For each section
    forEach($scope.sections, function(element, index) {
        if (element.data) {
            // update position
            element.data['Position'] = index;
            // send to api
            promises.push(AdminService.update(data_type, element.id, element.data));
        }
    });

    return $q.all(promises).then((values) => {
        $log.debug("Pushed updated order");
        if (!skipReload) {
            // Activate the view
            $timeout(function () {
                $rootScope.loaders[mysection] = false;
            }, timeToWait)
        }
    });
  }

  self.isSearch = function(section) {
    var key = 'search';
    return angular.lowercase(section.data['Section']) == key;
  }

  // Activate a dynamic welcome inside the view
  $timeout(function () {
    var check = 'welcome';
    if ($state.current.name.slice(0, check.length) == check) {
       getSectionData($scope, AdminService);
       self.init = 'rdb';
    }
  });

  self.sectionModels = [
    {
        name: 'Section',
        value: 'New section!',
        description: 'The name for your new welcome section',
        required: true,
        focus: true,
        chars: 50,
    },
    {
        name: 'Description',
        value: 'We will talk about a lot of things',
        description: 'Short description of your section. It will appear in the home page.',
        required: true,
        chars: 500,
    },
    {
        name: 'Content',
        value: 'This explanation is very long',
        description: 'Explanation of the section. It will appear in a separate page.',
    },
  ];

  self.removeSection = function (model)
  {
    $rootScope.loaders[mysection] = true;
    AdminService.delete(data_type, model.id)
     .then(function (response) {
      console.log("Removed", response);
      var message = {'Error': 'Failed to remove!'};
      if (response) message = {Removed:
            'Section ' + model.data['Section'] + ' deleted'}
      // TOAST
      $scope.showSimpleToast(message);
      // Reload data
      getSectionData($scope, AdminService)
       .then(function () {
        $timeout(function () {
          $rootScope.loaders[mysection] = false;
        }, timeToWait);
      });
    });
  }

  self.uploadSectionImage = function (ev, model)
  {
    // Prepare data for the dialog
    $scope.currentRecord = model.id;
    $scope.currentType = 'welcome';
    $scope.currentName = 'SECTION: ' + model.data['Section'];
    $mdDialog.show({
        templateUrl: blueprintTemplateDir + 'uploader.html' ,
        //clickOutsideToClose: false,
        scope: $scope.$new(),
    }).then(function (response) {
        console.log("Closing dialog", response);
    });

  }

//////////////////////////////////////
// HANDLING THE CREATION OF A DIALOG
  self.customFullscreen = $mdMedia('xs') || $mdMedia('sm');

  self.addSection = function(ev, model) {
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && self.customFullscreen;
    var id = null;
    if (model && model.id) {
        id = model.id;
    }

// Clear or insert data in the model
    for (var j = 0; j < self.sectionModels.length; j++) {
        var value = "";
        if (model) {
            value = model.data[self.sectionModels[j].name];
        }
        self.sectionModels[j].text = value;
    };
// Options
    var dialogOptions =
    {
      controller: DialogController,
      templateUrl: blueprintTemplateDir + 'add_section.html',
      parent: angular.element(document.body),
      // How to pass data to the dialog
      locals: {
        sectionModels: self.sectionModels,
        modelId: id,
      },
      targetEvent: ev,
      //clickOutsideToClose:true,
      onComplete: function(){
        // Focus on first textarea
        $timeout(function(){ angular.element("textarea")[0].focus(); });
      },
      fullscreen: useFullScreen
    }

// WHEN COMPLETED
    var afterDialog = function(response) {

      var update_id = response[0], remove = response[1];
      $log.debug("After dialog", update_id, remove);
      // Check if id
      var element = {};
      forEach(self.sectionModels, function(x, i) {
        element[x.name] = x.text;
      });

      var apicall = null;
      if (update_id) {
        if (remove) {
            apicall = AdminService.delete(data_type, update_id);
        } else {
            apicall = AdminService.update(data_type, update_id, element);
        }
      } else {
        console.log("Check position", element);
        element['Position'] = $scope.sections.length;
        apicall = AdminService.insert(data_type, element);
      }

      apicall.then(function (out) {
        console.log("Admin api call", out);
        if (out) {
          getSectionData($scope, AdminService)
           .then(function () {
            // Activate the view
            $rootScope.loaders[mysection] = false;
          });
        }
      });
    }

// Open
    $mdDialog.show(dialogOptions)
        .then(afterDialog);

// WATCH FOR FULL SCREEN
    $scope.$watch(function() {
      return $mdMedia('xs') || $mdMedia('sm');
    }, function(wantsFullScreen) {
      self.customFullscreen = (wantsFullScreen === true);
    });

  };

  // Activate dialog to insert new element if requested by url
  if ($stateParams.new) {
    self.addSection();
  }

}

function DialogController($scope, $rootScope, $mdDialog, sectionModels, modelId)
{

  $scope.sectionModels = sectionModels;
  $scope.id = modelId;
  $scope.title = "Add a new element";
  if (modelId) {
      $scope.title = "Edit/Update element";
  }

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.validate = function(model) {
    var valid = true;
    forEach(model, function(x, i) {
      if (x.required && !x.text) {
        valid = false;
      }
    });
    if (valid) {
      $rootScope.loaders[mysection] = true;
      $mdDialog.hide([modelId, null]);
    }
  };
/*
  $scope.remove = function() {
    $rootScope.loaders[mysection] = true;
    $mdDialog.hide([modelId, true]);
  };
*/
}

////////////////////////////////
// controller
////////////////////////////////

function TreeController($scope, $rootScope, $log, SearchService)
{
  // INIT controller
  $log.debug("Tree of life");
  var self = this;

  // Init scope data
  //self.dataCount = NaN;
  self.data = [];

// https://github.com/wix/angular-tree-control

    // options are found http://wix.github.io/angular-tree-control/
    self.treeOptions = {
        nodeChildren: "children",
        dirSelectable: false, //true,
        injectClasses: {
            ul: "a1",
            li: "a2",
            liSelected: "a7",
            iExpanded: "a3",
            iCollapsed: "a4",
            iLeaf: "a5",
            label: "a6",
            labelSelected: "a8"
        }
    }
    self.showSelected = function(selected) {
      $log.info("Selected node", selected);
      self.selectedTreeObj = selected.info;
    };

  self.ucFirst = function(string) {
    return string.capitalizeFirstLetter();
  }


  ////////////////////////////////////////
  // move me into a service
}
////////////////////////////////////////

function getType(key) {

  var types = [
      {value: 0, text: 'string', desc:
          'All text is allowed'},
      {value: 1, text: 'number', desc:
          'Only integers values'},
      {value: 2, text: 'email', desc:
          'Only e-mail address (e.g. name@mailserver.org)'},
      {value: 3, text: 'url', desc:
          'Only web URL (e.g. http://website.com)'},
      {value: 4, text: 'date', desc:
          'Choose a day from a calendar'},
      {value: 5, text: 'time', desc:
          'Choose hour and minutes'},
      {value: 6, text: 'pattern', desc:
          'Define a regular expression for a custom type'},
      {value: 7, text: 'color', desc:
          'Only colors in hexadecimal value. Choose from color picker.'},
      {value: 8, text: 'list', desc:
          'Define a list of possible values (e.g. a dictionary)'},
  ];
  // save type to be sure in the future?
  var type = types[0].text;
  if (types[key])
      type = types[key].text;
  return type;
}

function treeProcessData(SearchService, $scope) {

    var tree = [];
    SearchService.getSteps(true).then(function (steps)
    {
        forEach(steps, function(single, i){
            var fields = [];
            forEach(single.fields, function(field, j){
              var infos = {
                'name': field.name,
                'values': field.options,
                'type': getType(field.type),
                'required': field.required,
              };
              fields.push({
                'type': 'field', 'name': field.name, 'info': infos,
                "children": []});
            });
            tree.push({
              'type': 'step', 'name': single.step.name,
              "children": fields});
    });

    console.log("TREE", tree);
    $scope.myTree = tree;
    $scope.dataCount = tree.length;
});

  }

////////////////////////////////
// MAIN ADMIN controller
////////////////////////////////

function AdminController($scope, $rootScope, $log, AdminService, SearchService, $stateParams)
{
  // Init controller
  $log.debug("ADMIN page controller", $stateParams);
  var self = this;
  //TABS
  $scope.selectedTab = $stateParams.tab || 0;
  self.latestTab = -1;

  self.onTabSelected = function (key) {
      $log.debug("Selected", $scope.selectedTab, key);
      // Avoid to call more than once
      if ($scope.selectedTab == self.latestTab) {
        return false;
      }
      self.latestTab = angular.copy($scope.selectedTab);

      // INIT TAB FOR MANAGING SECTIONS
      if (key == 'sections') {
        $scope.sections = {};
        getSectionData($scope, AdminService);
      }
      // INIT TAB FOR TREE STEPS
      else if (key == 'tree') {
        $scope.dataCount = -1;
        treeProcessData(SearchService, $scope);
      }

  }

};

})();