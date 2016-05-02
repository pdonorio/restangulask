(function() {
  'use strict';

angular.module('web')
    .service('api', RestApiService);

function RestApiService($http, $auth, $log) {

    var self = this;

    // How long should i wait for API response?
    self.defaultTimeOut = 9500;

    // Api URI
    self.API_URL = apiUrl + '/';
    self.FRONTEND_URL = originalApiUrl + '/';

    self.endpoints = {
        check: 'verify',
        logged: 'verifylogged',
        admin: 'verifyadmin',
        register: 'doregistration',
    }


    self.getOrDefault = function (value, mydefault) {
        return typeof value !== 'undefined' ? value : mydefault;
    }
    self.checkToken = function () {
        return $auth.getToken();
    }

    self.apiCall = function (endpoint, method, data, id, errorCheck)
    {

      ////////////////////////
        //DEFAULTS
        errorCheck = self.getOrDefault(errorCheck, false);
        endpoint = self.getOrDefault(endpoint, self.endpoints.check);
        if (typeof id !== 'undefined' && id && method != 'POST') {
            endpoint += '/' + id;
        }
        method = self.getOrDefault(method, 'GET');
        var params = {};
        if (method == 'GET') {
            params = self.getOrDefault(data, {});
            data = {};
        } else if (method == 'POST') {
            data = self.getOrDefault(data, {});
        }
      ////////////////////////

        var currentUrl = self.API_URL + endpoint;
        if (endpoint == self.endpoints.register) {
            currentUrl = self.FRONTEND_URL + endpoint;
        };

        var headers = {
            //'Authentication-Token': token,
            'Content-Type': 'application/json',
            //'Content-Type': 'application/json; charset=utf-8',
            // 'Accept': 'application/json; charset=utf-8',
            //'Accept-Charset': 'charset=utf-8',
            //dataType: 'json',
        };

        var token = self.checkToken();
        //console.log("CHECK token", token);
        if (token) {
            headers['Authentication-Token'] = token;
        }

        var req = {
            method: method,
            url: currentUrl,
            headers: headers,
            data: data,
            params: params,
            timeout: self.defaultTimeOut,
        };

/* Note:
$http wraps the call inside the SCHEMA:

config : Object
data : Object
headers : (d)
status : 200
statusText : "OK"
__proto__ : Object

My response is inside $http response.data.
Well, this is how i wrap that call:
{
    "data": {
        "id": "2"
    },
    "data_type": "<class 'dict'>",
    "elements": 1,
    "status": 200
}

So we have again data and status.
This is because the main API python package we are writing,
is trying to use some standards, which were found already there
with Angular.


*/

        return $http(req).then(
            function successCallback(response) {

                $log.debug("API call successful", response);
                return response.data;
          }, function errorCallback(response) {
                $log.warn("API failed to call")
                if (errorCheck) {
                    return response;
                } else {
                    // Default: data or null
                    if (typeof response.elements === 'undefined') {
                        return null;
                    }
                    return response.data;
                }
        });
    }

    self.verify = function(logged)
    {
        var endpoint = self.endpoints.check;
        if (logged) {
            endpoint = self.endpoints.logged;
        }
        return self.apiCall(endpoint, 'GET', undefined, undefined, true)
            .then(function (response) {
                $log.debug("API verify:", response);
                if (response.status > 250) {
                    // API available
                    return false;
                } else if (response.status < 0) {
                    // API offline
                    return null;
                }
                return true;
            });
    }
}

})();