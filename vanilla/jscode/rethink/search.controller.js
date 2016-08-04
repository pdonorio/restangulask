(function() {
  'use strict';

angular.module('web')
    .controller('SearchController', SearchController)
    .controller('ChipsController', ChipsController)
    ;

function SearchController($scope, $rootScope, $log, $state,
    //hotkeys, keyshortcuts,
    SearchService)
{

  // INIT controller
  var self = this;
  self.goToLastRoute = $rootScope.goToLastRoute;
  $log.debug("Main SEARCH controller");

/*
    // Init keys
    hotkeys.bindTo($scope)
        .add({
            combo: "esc",
            description: "Quit from searching",
            callback: function() {
                keyshortcuts.exitSearch(event, self);
            }
        });
*/

  // INIT scope variables
  $scope.data = {};
  $scope.dataCount = null;
  $scope.results = false;
  $scope.setDataCount = function (value) {
    $scope.results = true;
    $scope.dataCount = value;
  }

  //////////////////////////////////////////////////////////
  // https://material.angularjs.org/latest/demo/autocomplete

  function loadAll(data_steps) {

    // Prepare steps name
    var steps = [];
    forEach(data_steps, function(single, i){
      steps[single.step.num] = single.step.name;
    });
    $scope.stepsInfo = steps;

    // Prepare total array of autocomplete divided by types
    var auto = [];
    forEach($scope.autocomplete, function(data, step){
      forEach(data, function(state, key){
        auto.push({
          value: state.toLowerCase(),
          display: state,
          type: steps[step+1],
        })
      });
    });
    return auto;
  }

  $scope.fillTable = function(response)
  {
    $log.debug("FILLING TABLE");
    $scope.data = [];
    $scope.dataCount = response.elements;
    $scope.counter = response.data.length;

    forEach(response.data, function (x, i)
    {
      // SINGLE DETAILS
      SearchService.getSingleData(x.record, false)
       .then(function(element)
      {
// FIX HTML VIEW?
        $scope.data.push(element);
        $scope.counter--;
        //console.log("MY counter", $scope.counter);
      });
    });
  }

  self.changePage = function(page) {
    $log.info("Page", page);
  }

}

////////////////////////////////
// controller
////////////////////////////////

function ChipsController($scope, $log, $q, $stateParams, SearchService)
{

  // Init controller
  var self = this;
  $log.debug("Chip controller");

  // https://material.angularjs.org/latest/demo/chips
  self.chips = [];

  self.newChip = function(chip) {
      $scope.setDataCount(null);
      $log.info("Requested tag:", chip, "total:", self.chips);
// TO FIX
// FOR EACH CHIPS
// ADD TO JSON TO MAKE MORE THAN ONE STEP ON RETHINKDB
// SO THIS WILL BE ONE SINGLE HTTP REQUEST
      // Choose table to query
      var promise = null;
      if (chip.type == 'Transcription') {
        promise = SearchService.filterDocuments(chip.display);
      } else {
        promise = SearchService.filterData(chip.display);
      }
      // Do query
      promise.then(function(out_data) {
        if (!out_data || out_data.elements < 1) {
          $scope.setDataCount(0);
          return null;
        }
        $scope.fillTable(out_data);
      });
  }

  self.removeChip = function(chip, index) {
// TO FIX
// IF YOU REMOVE YOU SHOULD REBUILD THE QUERY FROM START...
// JUST USE THE SAME FUNCTION OF NEW CHIP
    //console.log(chip, index);
    $log.error("Not implemented. It should be soon!");
  }

  // AUTOCOMPLETE CODE
  // HANDLE PARAMETER
  self.parameter = $stateParams.text;
  $log.debug("Auto Complete controller", self.parameter);

  if (self.parameter) {
    // Add value to chips
    var chip = {
        display: self.parameter,
        type: "Custom",
        value: self.parameter
    };
    self.chips.push(chip);
// TO FIX
    self.newChip(chip);
  }

  // Init scope
  self.searchText = null;
  self.states = [];

  // Functions to search with autocomplete
  function createFilterFor(query) {
    var lowercaseQuery = angular.lowercase(query);
    return function filterFn(state) {
      return (state.value.indexOf(lowercaseQuery) === 0);
    };
  }

  self.querySearch = function() {
    var query = self.searchText;
    $log.debug("Search", self.searchText)
    return query ?
        self.states.filter(createFilterFor(query)) :
        self.states;
  }

  self.searchAll = function () {
      $scope.setDataCount(null);
      // Do query
      SearchService.getData().then(function(out_data) {
        if (!out_data || out_data.elements < 1) {
          return null;
        }
        $scope.fillTable(out_data);
      });
  }

////////////////////////////////////////
//http://solutionoptimist.com/2013/12/27/javascript-promise-chains-2/
  var
    initSearchComplete = function (argument) {
        return SearchService.getSteps();
    },
    parallelLoad = function (steps) {

        console.log("STEPS", steps);
        if (steps.length < 1) {
           return false;
        }
        steps.push('Transcription')
// TO FIX
// should be a foreach on 'steps'
        var promises = {
            1: SearchService.getDistinctValuesFromStep(1),
            2: SearchService.getDistinctValuesFromStep(2),
            3: SearchService.getDistinctValuesFromStep(3),
            //Details?
            //4: SearchService.getDistinctValuesFromStep(4),
            //5: SearchService.getDistinctTranscripts(),
            4: SearchService.getDistinctTranscripts(),
        }
        return $q.all(promises).then((values) =>
        {
            forEach(values, function (api_response, step) {
              if (api_response.elements > 2) {
                $log.debug('Fullfilling step', steps[step]);
                //console.log(api_response);

                forEach(api_response.data, function(state, key){
                  self.states.push({
                    value: state.toLowerCase(),
                    display: state,
                        type: steps[step],
                  })
                });

              }
            });
            //throw( new Error("Just to prove catch() works! ") );
        });
    },
    reportProblems = function( fault )
    {
        $log.error( String(fault) );
    };

    initSearchComplete()
        .then( parallelLoad )
        .catch( reportProblems );

/* MIX STEPS AND AUTOCOMPLETE
    // Prepare total array of autocomplete divided by types
    var auto = [];
    forEach($scope.autocomplete, function(data, step){
      forEach(data, function(state, key){
        auto.push({
          value: state.toLowerCase(),
          display: state,
          type: steps[step+1],
        })
      });
    });
    return auto;
*/

    //self.states
// CHAINING PROMISES
////////////////////////////////////////

    self.searchAll();

}

})();