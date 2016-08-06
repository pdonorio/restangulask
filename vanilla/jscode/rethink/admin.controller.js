(function() {
  'use strict';

var DefaultColor = "#ff2600";

angular.module('web')
    .controller('WelcomeSlideController', WelcomeSlideController)
    .controller('WelcomeController', WelcomeController)
    .controller('SubWelcomeController', SubWelcomeController)
    .controller('WelcomeInfoController', WelcomeInfoController)
    .controller('WelcomeSubInfoController', WelcomeSubInfoController)
    .controller('DialogController', DialogController)
    .controller('TreeController', TreeController)
    .controller('AdminController', AdminController)

.controller('JustATest', function($rootScope, $scope, $timeout)
{

    // $rootScope.avoidTheToolbar = true;
    // $rootScope.disable_sidemenu = true;

    $scope.checking = [
        false,
        false,
        false,
        false,
    ];

    $scope.nextSlide = function (position) {
        forEach($scope.checking, function(element, index) {
            $scope.checking[index] = false;
        });
        $scope.checking[position - 1] = true;
    };

    $timeout(function () {
        $scope.nextSlide(1);
    }, 800);

})
;

var
    data_type = 'welcome'
    , slide_type = 'slides'
    , sub_type = 'subwelcome'
    , mysection = 'admin_sections'
    , mysubsection = 'admin_subsections'
    //, myslide = 'admin_slides'
    ;

// General purpose load data function
// To use only inside controllers
function getSectionData($scope, AdminService, custom_type, $sce)
{
    var myscope = {};
    var type = data_type;
    if (custom_type && custom_type != data_type) {
        type = custom_type;
    }
    //console.log("Type is", type, custom_type);

    //Recover sections
    return AdminService.getData(type).then(function (out)
    {
        //console.log("Getting data", type, out.data);

    // IF DATA IS PRESENT
      if (out !== null
        && out.hasOwnProperty('elements'))
      {

        //Preserve order
        var newdata = [];
        if (out.elements > 0) {
          for (var x = 0; x < out.data.length; x++) {
              newdata[x] = {};
          };

          forEach(out.data, function (element, index) {
            if (element && element != '') {

                var sec = element.data['Section'];
                var index = element.data['Position'];
                var anchor = "welcome.workinprogress";
                //console.log("Section", sec);

////////////////////////////////////////////////////////
// BY HAND.
// WARNING PORCATA...
                if (sec == 'Bienvenue') {
                    //console.log(sec, "Benvenuti");
                    anchor = 'welcome.subsection'
                } else if (sec == 'Base de données') {
                    //console.log(sec, "SEARCH?");
                    //anchor = 'public.fastsearch'
                    anchor = 'public.db'
                } else if (element.data['Content'].trim() != "") {
                    anchor = "welcome.more({" +
                        "element: " + index + ", " +
                        "section_type: 'welcome'" +
                        "})";
                }
////////////////////////////////////////////////////////

                element.link = anchor;

                if (type == data_type) {
                    if (!element.data['Color'] ||
                        element.data['Color'].trim() == "")
                    {
                        element.data['Color'] = DefaultColor;
                    }
                }

                // To show html if any
                if (element.data['Content'] && $sce) {
                    var tmp = angular.copy(element.data['Content']);
                    delete element.data['Content'];
                    element.data['Content'] = $sce.trustAsHtml(tmp);
                }

                newdata[index] = element;
            }
          });
          // VERIFY if some sections are missing
          for (var x = 0; x < newdata.length; x++) {
              if (!newdata[x]) {
                  newdata[x] = {
                    'data': {
                      'Section': null,
                      'Position': null,
                    }
                  };
              }
          }
        }
        myscope = angular.copy(newdata);

    // IF DATA MISSING!
      } else {
        $scope.failure = true;
      }


      // Fill the right scope
      if (type == slide_type) {
        $scope.slides = myscope;
      } else if (type == sub_type) {
        $scope.subsections = myscope;
      } else {
        $scope.sections = myscope;
      }
      //console.log("SCOPE", myscope, $scope);

    });
};

function WelcomeSubInfoController($scope, $rootScope, $log, $sce, AdminService)
{
    $log.debug("Welcome SUB info");
    var self = this;
    //$scope.subsections = null;

    getSectionData($scope, AdminService, sub_type, $sce)
     .then(function()
    {
        console.log("Obtained", $scope);
        // Pool off the right data
        self.subFolder = sub_type + '/';
        // $rootScope.loaders['welcome_info'] = true;
        //$scope.subsections = $scope.subsections[$stateParams.element];
        $rootScope.subsections = $scope.subsections;
        //console.log("LOADED");
    });

};

function WelcomeInfoController($scope, $log, $stateParams,
    AdminService)
{
    $log.warn("Welcome info", $stateParams);
    var self = this;
    self.loader = true;

    $scope.defaultColor = DefaultColor;
    self.title = "None";
    self.moreContent = "No section selected";
    self.images = null;

    var type = $stateParams.section_type;
    $log.debug("Info type", type);

    getSectionData($scope, AdminService, type)
     .then(function()
    {
        // Recover from scope
        var section = null;

        // Pool off the right data
        self.subFolder = type + '/';
        if (type == data_type) {
            section = $scope.sections[$stateParams.element];
        } else if (type == slide_type) {
            section = $scope.slides[$stateParams.element];
        } else if (type == sub_type) {
            section = $scope.subsections[$stateParams.element];
        }

        // Apply data
        if (section) {
            self.title = section.data['Section'];
            self.moreContent = section.data['Content'];
            self.images = section.images;
            self.loader = false;
        }
    });

};

//////////////////////////////////////
// Dedicated to SLIDES
function WelcomeSlideController($scope,
        $rootScope, $timeout, $log,
        AdminService, SearchService,
        $state, $stateParams,
        $mdMedia, $mdDialog, $q)
{
  $log.debug("Welcome Slides controller", $stateParams);
  var self = this;
  self.mainSubFolder = slide_type + '/';

  self.fixSlidesPositions = function (position) {
    var count = 0;
    var newSlides = [];

    // Fix
    forEach($scope.slides, function(element, index) {
        if (element.data) {
            newSlides[count++] = element;
        }
    });
    $scope.slides = angular.copy(newSlides);
    $log.debug("Fixed slides");

    // Push and reload
    $rootScope.loaders[mysection] = true;
    self.slidesResort(true).then(function () {
        getSectionData($scope, AdminService, slide_type).then(function () {
            // Activate the view
            $timeout(function () {
                $rootScope.loaders[mysection] = false;
            }, timeToWait)
        });
    });
  }

  self.slidesResort = function (skipReload)
  {
    if (!skipReload) {
        $rootScope.loaders[mysection] = true;
    }
    var promises = [];
    //console.log("TEST slides", $scope.slides);

    // For each section
    forEach($scope.slides, function(element, index) {
        if (element.data) {
            // update position
            element.data['Position'] = index;
            // send to api
            promises.push(AdminService.update(slide_type, element.id, element.data));
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

  self.sectionModels = [
    {
        name: 'Section',
        value: 'New slide!',
        description: 'The name for your new welcome slide/news',
        required: true,
        focus: true,
        chars: 50,
    },
    {
        name: 'Description',
        value: 'We will talk about a lot of things',
        description: 'Short description of your slide.',
        required: true,
        chars: 500,
    },
    {
        name: 'Content',
        value: 'This explanation is very long',
        description: 'Explanation of this slide news. It will be showed in a separate page.',
    },
  ];

  self.removeSlide = function (model)
  {
    $rootScope.loaders[mysection] = true;
    AdminService.delete(slide_type, model.id)
     .then(function (response) {
      console.log("Removed", response);
      var message = {'Error': 'Failed to remove!'};
      if (response) message = {Removed:
            'Section ' + model.data['Section'] + ' deleted'}
      // TOAST
      $scope.showSimpleToast(message);
      // Reload data
      getSectionData($scope, AdminService, slide_type)
       .then(function () {
        $timeout(function () {
          $rootScope.loaders[mysection] = false;
        }, timeToWait);
      });
    });
  }

  self.uploadSlideImage = function (ev, model)
  {
    // Prepare data for the dialog
    $scope.currentRecord = model.id;
    $scope.currentType = slide_type;
    $scope.currentName = 'SECTION: ' + model.data['Section'];
    $mdDialog.show({
        templateUrl: blueprintTemplateDir + 'uploader.html' ,
        //clickOutsideToClose: false,
        scope: $scope.$new(),
    }).then(function (response) {
        if (response) {
            $rootScope.loaders[mysection] = true;
            getSectionData($scope, AdminService, slide_type)
             .then(function () {
                $rootScope.loaders[mysection] = false;
            });
        };
    });

  }

  self.rmSlideImage = function (model, image_index) {
    $log.debug("Remove image", model, image_index);
    //delete model.images[image_index];
    model.images.splice(image_index, 1);
    var newdoc = {
        'destination': slide_type,
        'record': model.record,
        'images': model.images,
        'type': slide_type,
    }

    SearchService.updateImages(newdoc).then(function (response) {
        if (response)
            $log.info("Updated images");
    });
  }

  self.addSlide = function(ev, model) {
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
    }

// WHEN COMPLETED
    var slideAfterDialog = function(response) {

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
            apicall = AdminService.delete(slide_type, update_id);
        } else {
            apicall = AdminService.update(slide_type, update_id, element);
        }
      } else {
        console.log("Check position", element);
        element['Position'] = $scope.slides.length;
        apicall = AdminService.insert(slide_type, element);
      }

      apicall.then(function (out) {
        console.log("Admin api call", out);
        if (out) {
          getSectionData($scope, AdminService, slide_type)
           .then(function () {
            // Activate the view
            $rootScope.loaders[mysection] = false;
          });
        }
      });
    }

// Open
    $mdDialog.show(dialogOptions) .then(slideAfterDialog);

  };

}


//////////////////////////////////////
// Dedicated to SECTIONS
function WelcomeController($scope,
        $rootScope, $timeout, $log,
        AdminService, SearchService,
        $state, $stateParams,
        $mdMedia, $mdDialog, $q)
{
  $log.debug("Welcome admin controller", $stateParams);
  var self = this;
  $scope.loading = true;

  self.mainSubFolder = data_type + '/';
  self.secondarySubFolder = slide_type + '/';
  $scope.defaultColor = DefaultColor;

  self.fixPositions = function (position) {
    var count = 0;
    var newSlides = [];

    // Fix
    forEach($scope.sections, function(element, index) {
        if (element.data) {
            newSlides[count++] = element;
        }
    });
    $scope.sections = angular.copy(newSlides);
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
    var keys = [
        'search'    //english
        ,'ricerca'   //italiano
        ,'recherche'   //french
    ];

    var response = false;
    forEach(keys, function(key, i) {
        if (angular.lowercase(section.data['Section']) == key)
            response = true;
    });
    return response;

  }

  // Activate a dynamic welcome inside the view
  $timeout(function () {

    // ONLY IF CURRENT PAGE IS WELCOME
    var check = 'welcome';
    $scope.wallopme = false;

    if ($state.current.name.slice(0, check.length) == check) {

        $scope.h = window.innerHeight;
        $scope.w = window.innerWidth;

        //Sections
        getSectionData($scope, AdminService, data_type).then(function () {
            $scope.loading = false;
        });

        // //Slides
        // getSectionData($scope, AdminService, slide_type);

        //Type for the welcome template: rethinkdb template
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
        name: 'Color',
        value: 'Pick the code of a background color',
        description: 'Pick the code of a background color',
        //text: DefaultColor,
        required: false,
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
    $scope.currentType = data_type;
    $scope.currentName = 'SECTION: ' + model.data['Section'];
    $mdDialog.show({
        templateUrl: blueprintTemplateDir + 'uploader.html' ,
        //clickOutsideToClose: false,
        scope: $scope.$new(),
    }).then(function (response) {
        if (response) {
            $rootScope.loaders[mysection] = true;
            getSectionData($scope, AdminService)
             .then(function () {
                $rootScope.loaders[mysection] = false;
            });
        };
    });

  }

  self.rmImage = function (model, image_index) {
    $log.debug("Remove image", model, image_index);
    //delete model.images[image_index];
    model.images.splice(image_index, 1);
    var newdoc = {
        'destination': data_type,
        'record': model.record,
        'images': model.images,
        'type': data_type,
    }

    SearchService.updateImages(newdoc).then(function (response) {
        if (response)
            $log.info("Updated images");
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

//////////////////////////////////////
//////////////////////////////////////
// Dedicated to SUBSECTIONS
function SubWelcomeController($scope,
        $rootScope, $timeout, $log, AdminService, SearchService,
        $state, $mdMedia, $mdDialog, $q, $sce)
{
  $log.debug("SubWelcome controller!");
  var self = this;

  self.mainSubFolder = sub_type + '/';

  self.fixPositions = function (position) {
    var count = 0;
    var newSlides = [];

    // Fix
    forEach($scope.subsections, function(element, index) {
        if (element.data) {
            newSlides[count++] = element;
        }
    });
    $scope.subsections = angular.copy(newSlides);
    // $rootScope.subsections = $scope.subsections;
    // console.log("Fixed SUBsections", $rootScope);

    // Push and reload
    $rootScope.loaders[mysection] = true;
    self.resort(true).then(function () {
        getSectionData($scope, AdminService, sub_type).then(function () {
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
    //console.log("TEST SECTIONS", $scope.subsections);

    // For each section
    forEach($scope.subsections, function(element, index) {
        if (element.data) {
            // update position
            element.data['Position'] = index;
            // send to api
            promises.push(AdminService.update(sub_type, element.id, element.data));
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
    var keys = [
        'search'    //english
        ,'ricerca'   //italiano
        ,'recherche'   //french
    ];

    var response = false;
    forEach(keys, function(key, i) {
        if (angular.lowercase(section.data['Section']) == key)
            response = true;
    });
    return response;

  }

  // Activate a dynamic welcome inside the view
  $timeout(function () {
    var check = 'welcome';
    if ($state.current.name.slice(0, check.length) == check) {
        //Sections
        getSectionData($scope, AdminService, sub_type);
        //Slides
// DISABLED FOR NOW
// getSectionData($scope, AdminService, slide_type);
        //Type for the welcome template: rethinkdb template
        self.init = 'rdb';
    }
  });

  self.sectionModels = [
    {
        name: 'Section',
        value: 'New Sub Section!',
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
        description: 'You may write HTML content to any subsection.',
    },
  ];

  self.removeSection = function (model)
  {
    $rootScope.loaders[mysection] = true;
    AdminService.delete(sub_type, model.id)
     .then(function (response) {
      console.log("Removed", response);
      var message = {'Error': 'Failed to remove!'};
      if (response) message = {Removed:
            'Section ' + model.data['Section'] + ' deleted'}
      // TOAST
      $scope.showSimpleToast(message);
      // Reload data
      getSectionData($scope, AdminService, sub_type)
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
    $scope.currentType = sub_type;
    $scope.currentName = 'SECTION: ' + model.data['Section'];
    $mdDialog.show({
        templateUrl: blueprintTemplateDir + 'uploader.html' ,
        //clickOutsideToClose: false,
        scope: $scope.$new(),
    }).then(function (response) {
        if (response) {
            $rootScope.loaders[mysection] = true;
            getSectionData($scope, AdminService, sub_type)
             .then(function () {
                $rootScope.loaders[mysection] = false;
            });
        };
    });

  }

  self.rmImage = function (model, image_index) {
    $log.debug("Remove image", model, image_index);
    //delete model.images[image_index];
    model.images.splice(image_index, 1);
    var newdoc = {
        'destination': sub_type,
        'record': model.record,
        'images': model.images,
        'type': sub_type,
    }

    SearchService.updateImages(newdoc).then(function (response) {
        if (response)
            $log.info("Updated images");
    });
  }

//////////////////////////////////////
// HANDLING THE CREATION OF A DIALOG
  self.customFullscreen = $mdMedia('xs') || $mdMedia('sm');

  self.addSection = function(ev, model) {
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
    }

// WHEN COMPLETED
    var afterDialog = function(response) {

      var
        update_id = response[0],
        remove = response[1],
        html = response[2];
      $log.debug("After dialog", update_id, remove, html);
      // Check if id
      var element = {};
      forEach(self.sectionModels, function(x, i) {
        if (x.name == 'Content') {
            element[x.name] = html;
        } else {
            element[x.name] = x.text;
        }
      });

      var apicall = null;
      if (update_id) {
        if (remove) {
            apicall = AdminService.delete(sub_type, update_id);
        } else {
            apicall = AdminService.update(sub_type, update_id, element);
        }
      } else {
        console.log("Check position", element);
        element['Position'] = $scope.subsections.length;
        apicall = AdminService.insert(sub_type, element);
      }

      apicall.then(function (out) {
        console.log("A NEW SUB Admin api call", out);
        if (out) {
          getSectionData($scope, AdminService, sub_type)
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

  };

}

function DialogController(
    $scope, $rootScope, $log, $mdDialog, $sce,
    sectionModels, modelId)
{

  $scope.sectionModels = sectionModels;
  console.log("Models?", sectionModels);
  $scope.id = modelId;
  $scope.title = "Add a new element";
  if (modelId) {
      $scope.title = "Edit/Update element";
  }

  // HANDLING HTML
  self.realHtml = null;
  $scope.tiny_options = angular.copy($rootScope.tinymceOptions);
  $scope.tiny_options.height = 500;

  var unbind = $scope.$watch(
    "sectionModels[2].text",
    function handleChange( newValue, oldValue ) {
        self.realHtml = $sce.trustAsHtml(oldValue);
        $log.debug("HTML content watch:", oldValue);
    }
  );

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
      // stop watching the variable which will be destroyed
      unbind();
      $rootScope.loaders[mysection] = true;
      $mdDialog.hide([
        modelId,
        null,
        angular.copy($sce.getTrustedHtml(self.realHtml))
        ]);
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
                //'type': getType(field.type),
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
      // INIT TAB FOR MANAGING SUBSECTIONS
      if (key == 'subsections') {
        $scope.subsections = {};
        getSectionData($scope, AdminService, sub_type);
      }
      // INIT TAB FOR MANAGING SLIDES
      if (key == 'slides') {
        $scope.slides = {};
        getSectionData($scope, AdminService, slide_type);
      }
      // INIT TAB FOR TREE STEPS
      else if (key == 'tree') {
        $scope.dataCount = -1;
        treeProcessData(SearchService, $scope);
      }

  }

};

})();