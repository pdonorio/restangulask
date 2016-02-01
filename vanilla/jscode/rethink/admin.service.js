(function() {
  'use strict';

angular.module('web')
    .service('admin', AdminService);

function AdminService($log, api) {

    var self = this;
    self.endpoints = {
        admin: 'datadmins',
    }

    //////////////////
    // Base API call with Rethinkdb
    self.getData = function() {
        return api.apiCall(self.endpoints.admin);
    }

    self.insert = function(name, data) {
        return api.apiCall(self.endpoints.admin, 'POST',
            {
                type: {name: name},
                data: data,
            }
        );
    }

    self.update = function(name, id, data) {
        return api.apiCall(self.endpoints.admin, 'PUT',
            {
                type: {name: name},
                data: data,
            }, id);
    }
/*
    {
        "type": {
            "name": "Welcome page",
            "description": null
        },
        "data": {
            "whatever": "True"
        }
    }
*/

}

})();
