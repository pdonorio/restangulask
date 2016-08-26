# -*- coding: utf-8 -*-

""" Main routes """

from __future__ import absolute_import
import os
from pathlib import Path
from flask import Blueprint, render_template, request, jsonify
from config import user_config
from .security import login_api, register_api, logout_api
from commons import htmlcodes as hcodes
from commons.logs import get_logger
from config import CURRENT_FRAMEWORK

logger = get_logger(__name__)
CURRENT_BLUEPRINT = 'blueprint_example'

#######################################
# Blueprint for base pages, if any
cms = Blueprint('pages', __name__)

#######################################
# DEFAULTs and CUSTOMs from FRAMEWORK CONFIGURATION

# Framework system configuration
fconfig = user_config['frameworks']

# Static directories
staticdir = fconfig['staticdir'] + '/'
bowerdir = staticdir + fconfig['bowerdir'] + '/'

# Custom configurations
bwlibs = user_config['bower_components']
customcss = user_config['css']

# CSS files
css = []
for scss in fconfig['css']:
    css.append(staticdir + scss)
for scss in customcss:
    if 'http' not in scss:
        scss = os.path.join(staticdir, 'css', scss)
    css.append(scss)

# JS: Angular framework and app files
js = []
# Custom bower libs
for lib, files in fconfig['bower_components'].items():
    for file in files:
        filepath = os.path.join(bowerdir, lib, file)
        if file.endswith('css'):
            css.append(filepath)
        else:
            js.append(filepath)

# Save the right order:
# Main app angular js is right after bower libs
mainapp = os.path.join(staticdir, 'app', 'app.js')
js.append(mainapp)

#######################################
# ## JS BLUEPRINTS

# Load only a specified angular blueprint
if 'blueprint' not in user_config:
    logger.critical("No blueprint found in user config!")
else:
    CURRENT_BLUEPRINT = user_config['blueprint']

logger.info("Adding JS blueprint '%s'" % CURRENT_BLUEPRINT)
prefix = __package__
# JS BLUEPRINT config
jfiles = [Path(prefix + '/js/blueprint.js')]
# JS files in the root directory
app_path = os.path.join(prefix, staticdir, 'app')
jfiles.extend(Path(app_path).glob('*.js'))
# JS common files
common_path = os.path.join(app_path, 'commons')
jfiles.extend(Path(common_path).glob('*.js'))
# JS files only inside the blueprint subpath
blueprint_path = os.path.join(app_path, CURRENT_BLUEPRINT)
jfiles.extend(Path(blueprint_path).glob('**/*.js'))

# Use all files found
for pathfile in jfiles:
    strfile = str(pathfile)
    jfile = strfile[len(prefix) + 1:]
    if jfile not in js:
        js.append(jfile)

#######################################
user_config['content'] = {
    'project': user_config['project']['title']
}
user_config['content']['stylesheets'] = css
user_config['content']['jsfiles'] = js
# user_config['content']['images'] = imgs
# user_config['content']['htmlfonts'] = fonts


#######################################
def templating(page, framework=CURRENT_FRAMEWORK, **whatever):
    template_path = 'frameworks' + '/' + framework
    tmp = whatever.copy()
    tmp.update(user_config['content'])
    templ = template_path + '/' + page
    return render_template(templ, **tmp)


def jstemplate(title='App', mydomain='/'):
    """ If you decide a different domain, use slash as end path,
        e.g. /app/ """
    return templating('main.html', mydomain=mydomain, jstitle=title)


# #################################
# # BASIC INTERFACE ROUTES
def forward_response(response):
    """
    Utility to use a response from requests
    and forward it with Flask server rules
    """
    # Split the duo
    resp, code = response
    # Make sure that resp is at least an empty dictionary
    if resp is None:
        resp = {}
    # Now, safely, forward response
    return jsonify(**resp), code


@cms.route('/auth', methods=['POST'])
def auth():
    """
    IMPORTANT: This route is a proxy for JS code to APIs login.
    With this we can 'intercept' the request and save extra info on server
    side, such as: ip, user, token
    """

    # Verify POST data
    if request.json is None:
        return ("", hcodes.HTTP_BAD_UNAUTHORIZED)
    if not ('username' in request.json and 'password' in request.json):
        return "No valid (json) data credentials", hcodes.HTTP_BAD_UNAUTHORIZED

    # Request login (with or without API)
    return forward_response(
        login_api(request.json['username'], request.json['password']))


@cms.route('/doregistration', methods=['POST'])
def register():
    """ Registration endpoint to cover API and other needs """
    return forward_response(register_api(request.json))


################################################
# Create a configuration file for angular from python variables
@cms.route('/js/blueprint.js')
def jsblueprint():

    # Custom static welcome template
    js_template = 'null'
    key = 'angular_template'
    if key in user_config['content']:
        js_template = "'" + user_config['content'][key] + "'"

    variables = {
        'name': CURRENT_BLUEPRINT,
        'time': user_config['variables']['js']['load_timeout'],
        'api_url': request.url_root,
        'js_template': js_template
    }
    return render_template("blueprint.js", **variables)


######################################################
# MAIN ROUTE: give angular the power

@cms.route('/', methods=["GET"])
@cms.route('/<path:mypath>', methods=["GET"])
def home(mypath=None):
    """
    The main and only real HTML route in this server.
    The only real purpose is to serve angular pages and routes.
    """
    logger.debug("Using angular route. PATH is '%s'" % mypath)
    if mypath is None:
        # return templating('welcome.html')
        pass
    elif mypath == 'loggedout':
        return forward_response(logout_api(request.headers))
    return jstemplate()
