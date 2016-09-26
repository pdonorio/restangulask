(function() {
  'use strict';

angular.module('web')
    .controller('SessionsController', SessionsController);

function SessionsController($scope, $log, $auth,  api, FormDialogService)
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
		var text = "Are you really sure you want to invalidate this token?";
		var subtext = "This token will no longer available. This operation cannot be undone.";
		FormDialogService.showConfirmDialog(text, subtext).then(
			function(answer) {
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
			},
			function() {
				return false;
			}
		);
	}
}

})();
