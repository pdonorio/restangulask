(function() {
  'use strict';

angular.module('web').service('jsonapi_parser', JsonAPIParser);

function JsonAPIParser($log, $q) {

    var self = this;

    self.parseElement = function(element) {
        if (element.hasOwnProperty('attributes')) {
            var newelement = element.attributes;
        } else {
            var newelement = element;
        }

        if (element.hasOwnProperty('id')) {
            newelement.id = element.id;
        }

        if (element.hasOwnProperty('relationships')) {
            for (var key in element.relationships) {
                var subelement = element.relationships[key]
                if (subelement.length == 1) {
                    newelement['_'+key] = [self.parseElement(subelement[0])];
                } else {
                    newelement['_'+key] = [];
                    for (var i=0; i<subelement.length; i++) {
                        newelement['_'+key].push(self.parseElement(subelement[i]));
                    }
                }
            }
        }

        return newelement;
    }

    self.parseResponse = function(response) {
        return response.then(
            function(response) {
                if (!response.data) {
                    return response;
                }
                if (angular.isUndefined(response.data.length)) {
                    return response;
                }

                var newresponse = {'errors': response.errors, 'data': []}
                for (var i=0; i<response.data.length; i++) {
                    var element = self.parseElement(response.data[i]);

                    newresponse.data.push(element);
                }
                return newresponse
            }
            , function(response) {
                return $q.reject(response)
            }
        );
    }
}

})();