(function() {
  'use strict';

angular.module('web')
    .service('AdminService', AdminService);

function AdminService($log, api) {

    var self = this;
    self.endpoints = {
        admin: 'datadmins',
        eladmin: 'datamanage',
        up: 'update',
        expo: 'expo',
        expod: 'expodesc',
        imissing: 'dataimagemissing',
        tmissing: 'datatransmissing',
        stepstemplate: 'steps',
        data: 'datavalues',
        corruption: 'broken',
        useradmin: 'adminer',
        lexiqueproc: 'process',
    };

    //////////////////
    self.checkLexique = function() {
        return api.apiCall(self.endpoints.lexiqueproc, 'GET');
    };
    self.launchLexique = function() {
        return api.apiCall(self.endpoints.lexiqueproc, 'POST');
    };

    //////////////////
    self.listUsers = function() {
        return api.apiCall(self.endpoints.useradmin, 'GET');
    };

    //////////////////
    self.updateDocImage = function(id, fileName) {
        return api.apiCall(self.endpoints.up, 'POST',
            {file: fileName, id: id});
    };

    self.listCorrupted = function() {
        return api.apiCall(self.endpoints.corruption);
    }

    //////////////////
    // Expo data
    self.updateDocument = function(docId, docData) {
        return api.apiCall(self.endpoints.data, 'PUT', docData, docId);
    }
    self.updateExpoImage = function(fileName, opts) {
        return api.apiCall(self.endpoints.expo, 'POST',
            {options: opts, name: fileName});
    }
    self.updateExpoDescription = function (mode, data) {
        return api.apiCall(self.endpoints.expod, 'PUT', {'text': data}, mode);
    }
    self.getExpoDescription = function () {
        return api.apiCall(self.endpoints.expod);
    }

    //////////////////
    // STEPS
    self.getSteps = function(step) {
        return api.apiCall(self.endpoints.stepstemplate, 'GET', null, step);
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

    ////////////
    // EXPO
    self.getExpo = function() {
        return api.apiCall(self.endpoints.expo, 'GET');
    }
    self.getExpoImagesOnly = function() {
        return api.apiCall(self.endpoints.expo, 'GET', null, '_all');
    }
    self.getExpoMissing = function() {
        return api.apiCall(self.endpoints.expo, 'GET', null, '_nopartials');
    }
    self.getExpoSections = function() {
        return api.apiCall(self.endpoints.expo, 'GET', null, '_sections');
    }
    self.delExpoElement = function(id) {
        return api.apiCall(self.endpoints.expo, 'DELETE', null, id);
    }
    self.setExpoElement = function(id, data) {
        return api.apiCall(self.endpoints.expo, 'PUT', {expo: data}, id);
    }
    // EXPO
    ////////////

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
