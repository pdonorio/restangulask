# -*- coding: utf-8 -*-

""" Main routes """

from __future__ import absolute_import

import os
from collections import OrderedDict
import requests
from pathlib import Path
from flask import Blueprint, render_template, request, jsonify, g
from flask_login import logout_user, current_user
from .basemodel import user_config
from .security import login_point, register_api
from . import htmlcodes as hcodes
from config import get_logger, \
    FRAMEWORKS, API_URL, UPLOAD_FOLDER, EXTERNAL_PORT

logger = get_logger(__name__)
CURRENT_FRAMEWORK = None
BLUEPRINT_KEY = 'blueprint'
CURRENT_BLUEPRINT = BLUEPRINT_KEY + '_example'

#######################################
# Blueprint for base pages, if any
cms = Blueprint('pages', __name__)

#######################################
# Framework user configuration
fconfig = user_config['frameworks']
# Static directories
staticdir = fconfig['staticdir'] + '/'
bowerdir = staticdir + fconfig['bowerdir'] + '/'
# CSS files
css = []
for scss in fconfig['css']:
    css.append(bowerdir + scss)
for scss in fconfig['customcss']:
    if not scss.startswith('http'):
        css.append(staticdir + scss)
    else:
        css.append(scss)
# JS: Angular framework and app files
js = []
for sjs in fconfig['js']:
    js.append(bowerdir + sjs)
    if CURRENT_FRAMEWORK is None:
        for frame in FRAMEWORKS:
            if frame in sjs:
                CURRENT_FRAMEWORK = frame
                logger.info("Found framework '%s'" % CURRENT_FRAMEWORK)
for sjs in fconfig['customjs']:
    js.append(staticdir + sjs)
# Fonts
fonts = []
for sfont in fconfig['fonts']:
    # This should be an external url
    if 'http' not in sfont:
        sfont = staticdir + sfont
    fonts.append(sfont)
# Images
imgs = []
for simg in fconfig['imgs']:
    js.append(staticdir + simg)
#logger.debug("JSON img load: %s" % imgs)
# TO FIX!
if 'logos' not in user_config['content']:
    user_config['content']['logos'] = [{
        "src": "static/img/default.png", "width": '90'
    }]

#######################################
# ## JS BLUEPRINTS

# Load only a specified angular blueprint
if 'blueprints' not in user_config or \
  BLUEPRINT_KEY not in user_config['blueprints']:
    logger.critical("No blueprint file/key found!")
else:
    CURRENT_BLUEPRINT = user_config['blueprints'][BLUEPRINT_KEY]

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
    jfile = strfile[len(prefix)+1:]
    if jfile not in js:
        js.append(jfile)

#######################################
user_config['content']['stylesheets'] = css
user_config['content']['jsfiles'] = js
user_config['content']['images'] = imgs
user_config['content']['htmlfonts'] = fonts


#######################################
def templating(page, framework=CURRENT_FRAMEWORK, **whatever):
    template_path = 'frameworks' + '/' + framework
    tmp = whatever.copy()
    tmp.update(user_config['content'])
    templ = template_path + '/' + page
    return render_template(templ, **tmp)


def jstemplate(title='App', mydomain='/', page='main.html'):
    """ If you decide a different domain, use slash as end path,
        e.g. /app/ """
    return templating(page, mydomain=mydomain, jstitle=title)


# #################################
# # BASIC INTERFACE ROUTES
@cms.before_request
def load_users():
    """ Save the current user as the global user for each request """
    if current_user.is_authenticated:
        g.user = current_user
    else:
        g.user = None
# def before_request():
#     g.user = current_user


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


@cms.route('/doauth', methods=['POST'])
def auth():
    """
    IMPORTANT: This route is a proxy for JS code to APIs login.
    With this we can 'intercept' the request and save extra info on server
    side, such as: ip, user, token
    """
    # Verify POST data
    if not ('username' in request.json and 'password' in request.json):
        return "No valid (json) data credentials", hcodes.HTTP_BAD_UNAUTHORIZED
    # Request login (with or without API)
    return forward_response(login_point(
        request.json['username'], request.json['password']))


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

    api_url = request.url_root
    # print("APP MODE", os.environ.get('APP_MODE', ''))

    if os.environ.get('APP_MODE', '') == 'production':
        api_url = api_url.replace('http:', 'https:')

    variables = {
        'name': CURRENT_BLUEPRINT,
        'time': user_config['options']['load_timeout'],
        'api_url': api_url,
        'api_port': EXTERNAL_PORT,
        'js_template': js_template,
        'images_path': '/' + staticdir + UPLOAD_FOLDER.strip('/') + '/'
    }
    return render_template("blueprint.js", **variables)


# ################################################
# # A test endpoint
# @cms.route('/templatetest')
# def testing_templates():
#     template_path = 'custom' + '/' + CURRENT_BLUEPRINT
#     variables = {}
#     return render_template(
#       template_path + '/' + 'justatest.html', **variables)


################################################
# ZOOM?
@cms.route('/zoom/<string:document>/<string:code>')
def zoom(document, code):

    template_path = 'custom' + '/' + CURRENT_BLUEPRINT
    filename = '/empty'

    if g.user is None:
        return "Server has restarted after your last login." + \
            "<br>Please logout and login again..."

# https://teamtreehouse.com/community/attributeerror-anonymoususermixin-object-has-no-attribute-username

    HEADERS = {
        'content-type': 'application/json',
        'Authentication-Token': g.user.token
    }
    opts = {'stream': True, 'headers': HEADERS, 'timeout': 5}
    r = requests.get(API_URL + 'datadocs/' + document, **opts)
    out = r.json()

    # print("TEST\n\n", out)
    if len(out['data']) > 0:
        data = out['data'].pop()
        # print("TEST2\n\n", data['images'])
        for image in data['images']:
            if data['type'] != 'documents' and code == '0':
                code = data['type'] + '/' + image['code']
            elif image['code'] != code:
                continue
            filename = '/static/uploads/' + code
            # print("TEST!", filename, "\n\n\n")

        r = requests.get(API_URL + 'datamanage/' + data['record'], **opts)
        pages = r.json().pop('data', {})

        # ordered_pages = OrderedDict(sorted(pages.items()))
        ordered_pages = OrderedDict(
            sorted((int(key), value) for key, value in pages.items()))

        x = {
            'prev': None,
            'curr': None,
            'next': None
        }
        last_element = None

        for page, element in ordered_pages.items():
            # print("Page", page)
            element['num'] = page
            if x['curr'] is None:
                if element['current']:
                    x['curr'] = element
                    x['prev'] = last_element
            else:
                if x['next'] is None:
                    x['next'] = element
                    break
            last_element = element
        # print(x)

    variables = {
        'record': document,
        'page': code,
        'filename': filename,
        'pages': x,
        'name': CURRENT_BLUEPRINT,
    }

    return render_template(template_path + '/' + 'zoom.html', **variables)


######################################################
######################################################
# @cms.route('/', methods=["GET"])
# def welcome():
#     """ welcome page """
#     return jstemplate(mydomain='/', page='welcome.html')


# @cms.route('/test', methods=["GET"])
# def app():
#     """ welcome page """
#     return jstemplate(mydomain='/test', page='app.html')


# MAIN ROUTE: give angular the power
@cms.route('/app', methods=["GET"])
@cms.route('/app/<path:mypath>', methods=["GET"])
def angular(mypath=None):
    """
    The main and only real HTML route in this server.
    The only real purpose is to serve angular pages and routes.
    """
    logger.debug("Path: /%s" % mypath)
    if mypath is None:
        # return templating('welcome.html')
        pass
    elif mypath == 'loggedout':
        logout_user()
    return jstemplate(mydomain='/test1', page='none.html')


# MAIN ROUTE: give angular the power
@cms.route('/welcome', methods=["GET"])
@cms.route('/welcome/<path:mypath>', methods=["GET"])
def angularwelcome(mypath=None):
    logger.debug("Welcome Path: /%s" % mypath)
    return jstemplate(mydomain='/test2', page='none.html')
