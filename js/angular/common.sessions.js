(function() {
  'use strict';

angular.module('web')
    .controller('SessionsController', SessionsController);

function SessionsController($scope, $log, $auth, $mdDialog, api)
{

	var self = this;

	var token_in_use = $auth.getToken();

	self.loadTokens = function() {
		api.getActiveSessions().then(
			function(response) {
				self.tokens = response

				for (var i = 0; i < self.tokens.length; i++) {
					self.tokens[i].inuse = (self.tokens[i].token == token_in_use);
				}

			}
		);
	}
	self.loadTokens();

	self.revokeToken = function(id, $event) {
		var confirm = $mdDialog.confirm()
		          .title('Are you sure you want to invalidate this token?')
		          .textContent('This token will no longer available. This operation cannot be undone.')
		          .ariaLabel('revoke token')
		          .targetEvent($event)
		          .ok('DELETE')
		          .cancel('UNDO');
		$mdDialog.show(confirm).then(function() {

			var data = {}
			return api.revokeToken(id).then(
				function(out_data) {
		    		$log.debug("Token invalidated");
					self.loadTokens();
		        	return true;
	    		},
	    		function(out_data) {
		        	return false;
	    		});
		}, function() {
			return false;
		});
	}
}

})();
