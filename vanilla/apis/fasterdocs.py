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

GRAV_KEY = 'gravure'
MULTI4_KEY = 'langue'

DATE_SKEY = 'start_date'
DATE_EKEY = 'end_date'


class FastManage(ExtendedApiResource, FastSearch):

    # @deck.add_endpoint_parameter(name='field', ptype=str, required=True)
    # @deck.add_endpoint_parameter(name='value', ptype=str, required=True)
    @deck.add_endpoint_parameter(name='extrait')
    # @deck.add_endpoint_parameter(name='extrait', ptype=str, required=True)
    @deck.apimethod
    @auth_token_required
    def get(self, id=None):
        """
        NOTE: this method is not generic anymore

        I made it work only to recover sources pages
        """

        parties = {}

        # pp(self._args)
        # pp(self.get_input_new())

        extrait = None
        if id is not None:
            ex = self.fast_id(id)
        else:
            extrait = urllib.parse.unquote(self.get_input_new().get('extrait'))
            if extrait is None:
                return self.response(parties)
            ex = self.fast_query('extrait', extrait)

        hits = ex.pop()['_source']
        source = hits.get('source')
        if source is None:
            return parties
        data = self.fast_query('source', source)

        for element in data:
            s = element['_source']

            # from beeprint import pp
            # # pp(element)
            # pp(s)
            # print(s['sort_number'], s['extrait_number'])

            # key = s['sort_number']
            key = s['extrait_number']

            try:
                key = int(key)
            except BaseException:
                pass

            if extrait is None:
                current = element['_id'] == id
            else:
                current = s['extrait'] == extrait

            parties[key] = {
                'id': element['_id'],
                'name': s['extrait'],
                'page': s['page'],
                # Temps: "-", Actions: "-", Apparato: "-"
                'current': current
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
    @deck.add_endpoint_parameter(name=GRAV_KEY, ptype=bool)
    @deck.add_endpoint_parameter(name=MULTI1_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=MULTI2_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=MULTI3_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=MULTI4_KEY, ptype=str)
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
            PARTY_KEY, SOURCE_KEY, PLACE_KEY, SCRIPT_KEY, GRAV_KEY,
            MULTI1_KEY, MULTI2_KEY, MULTI3_KEY, MULTI4_KEY,
            DATE_SKEY, DATE_EKEY,
        ]
        for key in filters_keys:
            tmp = self._args.get(key)
            if tmp is not None:
                flag = True
                if isinstance(tmp, str) and tmp.strip() == '':
                    flag = False

                if flag:
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

    @deck.add_endpoint_parameter(name='size')
    @deck.add_endpoint_parameter(name='category', ptype=int, default=0)
    @deck.apimethod
    @auth_token_required
    def get(self, term=None):
        inputs = self.get_input_new()
        size = inputs.get('size', 5)
        category = inputs.get('category', 0) > 0
        # print("SIZE", size)
        self.get_instance()
        data, count = self.fast_get_all(term, size=size, category=category)
        return self.response(data, elements=count)
