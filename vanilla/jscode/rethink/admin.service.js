(function() {
  'use strict';

angular.module('web')
    .service('AdminService', AdminService);

function AdminService($log, api) {

    var self = this;
    self.endpoints = {
        admin: 'datadmins',
        expo: 'expo',
        imissing: 'dataimagemissing',
        tmissing: 'datatransmissing',
    }

    //////////////////
    // Admin fix on normal parts
    self.getDocumentsWithNoImages = function() {
        return api.apiCall(self.endpoints.imissing);
    }
    self.getDocumentsWithNoTrans = function() {
        return api.apiCall(self.endpoints.tmissing);
    }
    self.setDocumentTrans = function(record, data) {
        return api.apiCall(
            self.endpoints.tmissing,
            'PUT', data, record);
    }

    //////////////////
    // Base API call with Rethinkdb
    self.getData = function(type) {
        return api.apiCall(self.endpoints.admin, 'GET', {type: type});
    }

    self.getExpo = function() {
        return api.apiCall(self.endpoints.expo, 'GET');
    }

    self.setExpoElement = function(id, data) {
        return api.apiCall(self.endpoints.expo, 'PUT', {expo: data}, id);
    }

    self.insert = function(name, data) {
        return api.apiCall(self.endpoints.admin, 'POST',
            {
                type: name,
                data: data,
            }
        );
    }

    self.update = function(name, id, data) {
        return api.apiCall(self.endpoints.admin, 'PUT',
            {
                type: name,
                data: data,
            }, id);
    }

    self.delete = function(name, id) {
        return api.apiCall(self.endpoints.admin, 'DELETE', null, id);
    }

}

})();
