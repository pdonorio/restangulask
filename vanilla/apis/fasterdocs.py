# -*- coding: utf-8 -*-

"""
Some FAST endpoints implementation
"""

from __future__ import absolute_import

import urllib
from flask_security import auth_token_required  # , roles_required
from ..base import ExtendedApiResource
from ..services.elastic import FastSearch
from .. import decorators as deck

# from beeprint import pp
from ... import get_logger

logger = get_logger(__name__)

PARTY_KEY = 'fete'
SOURCE_KEY = 'source'
SCRIPT_KEY = 'manuscrit'
PLACE_KEY = 'lieu'
MULTI1_KEY = 'apparato'
MULTI2_KEY = 'actions'
MULTI3_KEY = 'temps'

DATE_SKEY = 'start_date'
DATE_EKEY = 'end_date'


class FastManage(ExtendedApiResource, FastSearch):

    # @deck.add_endpoint_parameter(name='field', ptype=str, required=True)
    # @deck.add_endpoint_parameter(name='value', ptype=str, required=True)
    @deck.add_endpoint_parameter(name='extrait')
    # @deck.add_endpoint_parameter(name='extrait', ptype=str, required=True)
    @deck.apimethod
    @auth_token_required
    def get(self):
        """
        NOTE: this method is not generic anymore

        I made it work only to recover sources pages
        """

        parties = {}
        # pp(self._args)
        # pp(self.get_input_new())
        extrait = urllib.parse.unquote(self.get_input_new().get('extrait'))
        if extrait is None:
            return self.response(parties)
        ex = self.fast_query('extrait', extrait)
        source = ex.pop()['_source']['source']
        data = self.fast_query('source', source)

        for element in data:
            # from beeprint import pp
            # pp(element)
            s = element['_source']
            # print(s['sort_number'], s['extrait_number'])
            # key = s['sort_number']
            key = s['extrait_number']
            parties[key] = {
                'id': element['_id'],
                'name': s['extrait'],
                'page': s['page'],
                'current': s['extrait'] == extrait
            }
        return self.response(parties)

    @deck.apimethod
    @auth_token_required
    def delete(self, id):
        if not self.fast_remove(id):
            return self.response(obj='Failed to delete id', fail=True)
        return self.response(id)


class FastDocs(ExtendedApiResource, FastSearch):
    """ A faster search on key values of the database documents """

    @deck.add_endpoint_parameter(name=PARTY_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=SOURCE_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=PLACE_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=SCRIPT_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=MULTI1_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=MULTI2_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=MULTI3_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=DATE_SKEY, ptype=str)
    @deck.add_endpoint_parameter(name=DATE_EKEY, ptype=str)
    @deck.apimethod
    @auth_token_required
    def get(self, searchterms=None):

        if not self.get_instance():
            return self.response(obj="Connection failed", fail=True)

        #####################################
        # filters
        filters = {}
        # pp(self._args)
        filters_keys = [
            PARTY_KEY, SOURCE_KEY, PLACE_KEY, SCRIPT_KEY,
            MULTI1_KEY, MULTI2_KEY, MULTI3_KEY,
            DATE_SKEY, DATE_EKEY,
        ]
        for key in filters_keys:
            tmp = self._args.get(key)
            if tmp is not None and tmp.strip() != '':
                filters[key] = tmp
        # pp(filters)

        #####################################
        current_element, limit = self.get_paging()
        data, count = self.fast_get(
            searchterms, current_element, limit, filters=filters)

        if data is None:
            return self.response(obj='Request failed', fail=True)

        return self.response(data, elements=count)


class FastSuggestion(ExtendedApiResource, FastSearch):
    """ A faster search on key values of the database documents """

    @deck.apimethod
    @auth_token_required
    def get(self, searchterms=None):
        self.get_instance()
        return self.response(self.fast_suggest(searchterms))


class FastLex(ExtendedApiResource, FastSearch):

    @deck.apimethod
    @auth_token_required
    def get(self, term=None):
        self.get_instance()
        data, count = self.fast_get_all(term)
        return self.response(data, elements=count)
