(function() {
  'use strict';

angular.module('web').service('SchemaFormService', SchemaFormService);

function SchemaFormService()
{

	var self = this;

	self.json2Form = function(schema, data, submitText) {

		// Variables to be returned
		var fields = {};
		var model = {}
		var form = []

		// Help header, if needed

		/*
			var help_header = {}
			help_header.type = "help";
			help_header.helpvalue = "<div class=\"alert alert-info\">Evviva!!</div>"
			form.push(help_header);
		*/

		// List of required fields
		var required = [];
		
		// fields basic values
		fields.type = "object";
		//fields["title"] = "Form title...";
		fields.properties = {}

		for (var i=0; i<schema.length; i++) {

			var field = {}
			var options = {}

			// Field definition (received from input json)
			var s = schema[i];
			var fieldname = s.key;
			var type = s.type;

			if (s.required == "true") required.push(fieldname);

			//Type definition
			var field_type = "";
			var input_type = "";
			var format = "";

			if (type == "text") {
				field_type = "string";
				input_type = "input";
			} else if (type == "longtext") {
				field_type = "string";
				input_type = "textarea";
			} else if (type == "int") {
				field_type = "integer";
				input_type = "integer";
			} else if (type == "timestamp") {
				field_type = "date";
				input_type = "input";
			} else if (type == "select") {
				field_type = "string";
				input_type = "select";
			} else if (type == "date") {
				field_type = "string";
				input_type = "input";
				// format = "date"
				s.description = "dd/mm/yyyy";
			} else if (type = "autocomplete") {
				field_type = "object";
				input_type = "autocomplete";
				options.optionFilter = fieldname+"_querySearch";
			}

			//other known field_type:
			//	- number
			//	- boolean

			//if email => "pattern": "^\\S+@\\S+$",

			field.title = s.label;
			field.type = field_type; 
			if (format != "") field.format = format;
			field.default = s.default;
			//field.validationMessage = "Custom Message!";
			//field.minLength = 3;
			//field.maxLength = 20;
			//field.description = s.description;

			options.key = fieldname;
			options.type = input_type
			options.placeholder = s.description;

			if (input_type == 'select') {
				options.type = input_type;
				options["titleMap"] = [];
				field["enum"] = [];

				if (s.options) {
					for (var j=0; j<s.options.length; j++) {
						var v = s.options[j];
						var v_id = v.id.toString();
						var v_n = v.value

						field["enum"].push(v_id)
						options["titleMap"].push({"value":v_id, "name":v_n});
					}
				}
			}

			// Save single input field information
			fields.properties[fieldname] = field;
			form.push(options);

			// Pre-filling fields (useful for updates)
			if (data) {
				if (data[fieldname] == null) {
					model[fieldname] = ""
				} else {
					model[fieldname] = data[fieldname];
				}

				if (field_type == "integer") {
					model[fieldname] = parseInt(model[fieldname]);
				}
			}
		}

		// Save	list of required fields
		fields.required = required;

		// // Add submit button to the form
		var submit = {}
		submit.type = "submit";
		submit.title = submitText;
		submit.style = "btn-success";
		form.push(submit);

		// Return all information
		return {"fields":fields, "form":form, "model": model};
	}

}

})();
