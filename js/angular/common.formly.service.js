(function() {
  'use strict';

angular.module('web').service('FormlyService', FormlyService);

function FormlyService(noty)
{

	var self = this;

	self.json2Form = function(schema, data, DataController) {
		var fields = [];
		var model = {}
		for (var i=0; i<schema.length; i++) {

			var s = schema[i];
			var k = s.key;

			var ftype = "";
			var ttype = "";

			var field = {}
			field['templateOptions'] = {}


			if (s['type'] == "text") {
				ftype = "input";
				ttype = "text";
			} else if (s['type'] == "longtext") {
				ftype = "textarea";
				ttype = "text";
			} else if (s['type'] == "int") {
				ftype = "input";
				ttype = "number";
			} else if (s['type'] == "date") {
				ftype = "input";
				ttype = "date";
			} else if (s['type'] == "select") {
				ftype = "select";
				ttype = "select";
			} else if (s['type'] == "autocomplete") {
				// Custom defined type
				ftype = "autocomplete";
				ttype = "autocomplete";
			} else if (s['type'] == "typeahead") {
				// Custom defined type (bootstrap) - to ovveride autocomplete
				ftype = "typeahead";
				ttype = "typeahead";
			}

			field['key'] = s['key'];
			field['type'] = ftype; 
			if ('default' in s)
				field['defaultValue'] = s['default'];

			field['templateOptions']['label'] = s['label'];
			field['templateOptions']['placeholder'] = s['description'];
			field['templateOptions']['type'] = ttype; 
			field['templateOptions']['required'] = (s['required'] == "true");
			if (ttype == 'textarea') {
				field['templateOptions']['rows'] = 5;
			}
			if (ttype == 'select') {
				field['templateOptions']['labelProp'] = "value";
      			field['templateOptions']['valueProp'] = "id";
      			field['templateOptions']['options'] = s['options']
      			//field['templateOptions']['multiple'] = false;
			}

			if (ttype == 'autocomplete') {
				field['controller'] = DataController+" as ctrl";
			}
			if (ttype == 'date') {
				console.log(data)
			}


			fields.push(field);

			if (data) {
				if (data[k] == null) {
					model[k] = ""
				} else if (typeof data[k] === "object") {
					model[k] = data[k]["id"];
				} else {
					model[k] = data[k];
				}
				if (ttype == "number") {
					model[k] = parseInt(model[k]);
				}
			}
		}

		// Return all information
		return {"fields":fields, "model": model};
	}

}

})();
