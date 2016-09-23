(function() {
  'use strict';

angular.module('web')
    .service('api', RestApiService);

function RestApiService($http, $q, $auth, $log) {

    var self = this;
    // Api URI
    self.API_URL = apiUrl + '/';
    self.AUTH_URL = authApiUrl + '/';
    self.FRONTEND_URL = serverUrl + '/';

    self.endpoints = {
        check: 'status',
        logged: 'profile',
        login: 'login',
        tokens: 'tokens',
        // logout: 'logout',
        logout: 'loggedout',
        admin: 'verifyadmin',
        register: 'doregistration',
    };


    self.getOrDefault = function (value, mydefault) {
        return typeof value !== 'undefined' ? value : mydefault;
    };
    self.checkToken = function () {
        return $auth.getToken();
    };

    self.apiCall = function (endpoint, method, data, id, returnRawResponse, skipPromiseResolve)
    {

      ////////////////////////
        //DEFAULTS
        returnRawResponse = self.getOrDefault(returnRawResponse, false);
        endpoint = self.getOrDefault(endpoint, self.endpoints.check);

        method = self.getOrDefault(method, 'GET');
        skipPromiseResolve = self.getOrDefault(skipPromiseResolve, false);

        var params = {};
        if (method == 'GET') {
            params = self.getOrDefault(data, {});
            data = {};
        } else if (method == 'POST') {
            data = self.getOrDefault(data, {});
        }

        var currentUrl = self.API_URL + endpoint;
//////////////////////////////
// WARNING PORCATA
        if (endpoint == self.endpoints.login) 
            currentUrl = self.AUTH_URL + endpoint;
        else if (endpoint == self.endpoints.logged) 
            currentUrl = self.AUTH_URL + endpoint;
        else if (endpoint == self.endpoints.tokens) 
            currentUrl = self.AUTH_URL + endpoint;
        else if (endpoint == self.endpoints.register)
            currentUrl = self.FRONTEND_URL + endpoint;
        else if (endpoint == self.endpoints.logout) {
            currentUrl = self.FRONTEND_URL + endpoint;
        }
//////////////////////////////

        if (typeof id !== 'undefined' && method != 'POST') {
            currentUrl += '/' + id;
        }

        var token = self.checkToken(),
            timeout = 60000,
            req = {
                method: method,
                url: currentUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
                data: data,
                params: params,
                timeout: timeout,
            }

        if (skipPromiseResolve) return $http(req);

        return $http(req).then(
            function successCallback(response) {
                //$log.debug("API call successful");

                if (returnRawResponse) return response;

                if (response.status == 204) {
                    if (response.data == "") {
                        response.data = {}
                        response.data.Response = ""
                    }
                }

                return response.data.Response;
          }, function errorCallback(response) {
                $log.warn("API failed to call")

                if (returnRawResponse) return $q.reject(response);

                if (!response.data || !response.data.hasOwnProperty('Response')) {
                    return $q.reject(null);
                } 
                if (typeof response.data.Response === 'undefined') {
                    return $q.reject(null);
                }

                return $q.reject(response.data.Response);
        });
    }

    self.verify = function(logged)
    {
        var endpoint = self.endpoints.check;
        if (logged) {
            endpoint = self.endpoints.logged;
        }
        return self.apiCall(endpoint, 'GET', undefined, undefined, true)
            .then(function successCallback(response) {
                $log.debug("API verify:", response);
                if (response.status < 0) {
                    // API offline
                    return null;
                }
                return response.data.Response.data;
                //return true;
            }, function errorCallback(response) {
                return false
            });
    }
    self.getActiveSessions = function()
    {
        return self.apiCall("tokens", 'GET').then(
            function(response) {
                return response.data
            }, function(response) {
                return response
            }
            );
    }

    self.revokeToken = function(id)
    {
        return self.apiCall("tokens", 'DELETE', {}, id).then(
            function(response) {
                return response
            }, function(response) {
                return response
            }
            );
    }
 
}

})();
