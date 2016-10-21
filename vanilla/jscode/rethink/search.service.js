(function() {
  'use strict';

angular.module('web')
    .service('SearchService', SearchService);

function SearchService($log, api) {

    var self = this;

    self.latestSteps = [];
    self.endpoints = {
        search: 'datavalues',
        submit: 'datakeys',
        documents: 'datadocs',
        users : 'accounts',
        fast: 'datasearch',
        suggest: 'datasuggest',
        fete: 'datalist',
        extra: 'steps',
        fastmanage: 'datamanage',
        lexique: 'lex',
    }

    self.getLex = function(id) {
        return api.apiCall(self.endpoints.lexique);
    }

//////////////////
// Base API calls with Rethinkdb
    self.removeElement = function(id) {
        return api.apiCall(self.endpoints.search, 'DELETE', null, id);
    }

    self.getData = function() {
        return api.apiCall(self.endpoints.search);
    }

    self.getBaseSearchData = function(id)
    {
      return api.apiCall(self.endpoints.search, 'GET', {filter: 'basefastsearch'})
       .then(function(out)
       {
          if (!out || out.elements < 1) {
              return false;
          }
          return out.data;
        });
    }

    self.getDataToEdit = function(id)
    {
      return api.apiCall(self.endpoints.search, 'GET', {details: 'full'}, id)
       .then(function(out)
       {
          if (!out || out.elements < 1) {
              return false;
          }
          return out.data;
        });
    }

    self.getSingleData = function(id, details)
    {

      var detailed = 'short';
      if (details) {
        detailed = 'full';
      }

      //$log.debug("Single data", id);
      return api.apiCall(
        self.endpoints.search,
        'GET', {details: detailed}, id)
       .then(function(out)
       {
          if (!out || out.elements < 1) {
              return false;
          }
          var element = {id: id, thumb: null, images: {},};
          forEach(out.data, function(value, key){
              var stepName = self.latestSteps[key+1];
              element[stepName] = value;
          });
          return self.getDocs(id).then(function(out_docs)
          {
            //console.log("DOCS", out_docs);
            if (out_docs && out_docs.elements > 0)
            {
              // RECOVER ALL IMAGES
              var images = out_docs.data[0].images;
              element.images = images;
              // HANDLE ONLY FIRST ONE AS THUMBNAIL IN MAIN SEARCH
              element.thumb = images[0].filename
                .replace(/\.[^/.]+$/, "")+'/TileGroup0/0-0-0.jpg';
            }
            $log.debug("Single element", element);
            return element;
          }); // GET DOCUMENTS

          });
    }

    self.doQuery = function(endpoint, filters) {
        return api.apiCall(endpoint, 'GET', filters);
    }
// Base API calls
//////////////////

// OLD
    // self.getSteps = function(id) {
    //     return api.apiCall(self.endpoints.submit, 'GET', undefined, id)
// NEW
    self.getSteps = function(all)
    {
        return api.apiCall(self.endpoints.submit)
          .then(function(out_steps) {
            // Prepare steps name
            var steps = [];
            if (out_steps && out_steps.hasOwnProperty('data'))
            {
                if (all) {
                    return out_steps.data;
                }
                forEach(out_steps.data, function(single, i){
                  steps[single.step.num] = single.step.name;
                });
            }
            self.latestSteps = steps;
            return steps;
        });
    }

    self.getDistinctValuesFromMultiStep = function(position) {

      var step = 4
      return api.apiCall(self.endpoints.extra, 'POST',
        {'step': step, 'position': position})
       .then(function(out)
       {
          if (out.elements && out.elements > 0 && out.data[0].extra) {
            var tmp = out.data[0].extra
                .replace(new RegExp("[\.]+$"), "")
                .split(', ');
            out.data = tmp;
            // console.log('TEST MULTI OUT', out, tmp);
          }
          return out;
        });
    }

    self.getDistinctValuesFromStep = function(step, position) {

      if (!position)
        position = 1;
      return self.doQuery(self.endpoints.search,
            {
                perpage: 0, //all
                filter: 'autocompletion',
                step: step,
                position: position
            }
        );
    }

    self.filterData = function(filter) {
        return self.doQuery(
            self.endpoints.search,
            {
                filter: 'nested_filter',
                position: 1,
                key: filter,
            }
        );
    }

    self.recoverCode = function(filter, field) {
        return self.doQuery(
            self.endpoints.search,
            {
                filter: 'recover_code',
                key: filter,
                field: field,
            }
        );
    }

    self.recoverPages = function(fete, current) {
        return self.doQuery(self.endpoints.fastmanage,
            {
                field: 'fete',
                value: fete,
                current: current,
            });
    }

    self.getDocs = function(id) {
        return api.apiCall(
            self.endpoints.documents,
            undefined, undefined, id);
    }

/*
    self.getDocsFromType = function(type) {
        return api.apiCall(
            self.endpoints.documents, 'POST', {'destination': type});
    }
*/

    self.getDistinctTranscripts = function() {
      return self.doQuery(self.endpoints.documents,
            {
                perpage: 0, //all
                filter: 'notes',
            }
        );
    }
    self.filterDocuments = function(filter) {
        return self.doQuery(
            self.endpoints.documents,
            {
                filter: 'notes',
                key: filter,
            }
        );
    }

    //////////////////////////
    self.updateImages = function(data) {
        return api.apiCall(
            self.endpoints.documents,
            'PUT', data, data.record);
    }

//////////////////////////
//////////////////////////

    //////////////////////////
    self.getDataFast = function(searchTerms, current, filters) {

        if (!filters)
            filters = {}
        filters['currentpage'] = current;

        return api.apiCall(self.endpoints.fast, 'GET', filters, searchTerms);
    }

    //////////////////////////
    self.getSuggestionsFast = function(searchTerms) {
        return api.apiCall(self.endpoints.suggest, 'GET', null, searchTerms);
    }

    //////////////////////////
    self.getFetes = function() {
        return api.apiCall(self.endpoints.fete);
    }
    // self.getFete = function(fete) {
    //     return api.apiCall(self.endpoints.fete, 'POST', {fete: fete});
    // }

}

})();
