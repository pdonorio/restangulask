# -*- coding: utf-8 -*-

""" Configurations """

import os
import commentjson as json

#######################
# Warning: this decides about final configuration
DEBUG = True
PATH = 'specs'   # Main directory where all conf files are found
# Warning: this decides about final configuration
#######################

CONFIG_PATH = 'config'
JSON_EXT = 'json'
FRAMEWORKS = ['bootstrap', 'materialize', 'foundation']

BACKEND = False
BACKEND_NAME = 'myapi'
for key in os.environ.keys():
    if BACKEND_NAME == key.lower()[0:5]:
        BACKEND = True

if not BACKEND:
    print("Fatal error: could not find a backend container.")
    exit(1)

PORT = 5000
URL = 'http://%s:%s' % (BACKEND_NAME, PORT)
API_URL = URL + '/api/'
AUTH_URL = URL + '/auth/'
########################################


########################################
# Read user config
def get_json_conf(path, file):
    filename = os.path.join(CONFIG_PATH, path, file + "." + JSON_EXT)
    with open(filename) as f:
        return json.load(f)

    return None


blueprint = get_json_conf(PATH, "js_init")
blueprint = blueprint['blueprint']

user_config = get_json_conf(PATH, blueprint)

user_config['frameworks'] = get_json_conf("angular", "frameworks")


########################################
class BaseConfig(object):

    DEBUG = os.environ.get('APP_DEBUG', DEBUG)
    # LOG_DEBUG = True
    LOG_DEBUG = False
    TESTING = False
    MYCONFIG_PATH = os.path.join(CONFIG_PATH, PATH)
    BASE_DB_DIR = '/dbs'
    SQLLITE_DBFILE = 'frontend.db'
    dbfile = os.path.join(BASE_DB_DIR, SQLLITE_DBFILE)
    SECRET_KEY = 'simplesecret'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + dbfile
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = '/uploads'

    HOST = 'localhost'
    PORT = int(os.environ.get('PORT', 5000))

    BASIC_USER = {
        'username': user_config['variables'].get('username', 'prototype'),
        'password': user_config['variables'].get('password', 'test'),
        'email': user_config['variables'].get('email', 'idonotexist@test.com')
    }
