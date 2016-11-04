// JINJA TEMPLATE (not AngularJs syntax)

// Choose your blueprint
var blueprint = '{{name}}';
// Note: remember to define with .constant a 'rethinkRoutes'

// Time to wait before initial page load
var timeToWait = {{time}}; // measured in ms

// A possible static template for your home page
var welcomeTemplate = {{js_template}};

// Api variables
var apiPort = '{{api_port}}';
var originalApiUrl = '{{api_url}}'.slice(0, -1);
var serverUrl = originalApiUrl;
var ifPort = originalApiUrl.indexOf(':', 5);
if (ifPort > 0) {
    serverUrl = serverUrl.slice(0, ifPort);
}
var apiUrl = serverUrl + ':' + apiPort + '/api';

// Other
var imagesPath = '{{images_path}}'
