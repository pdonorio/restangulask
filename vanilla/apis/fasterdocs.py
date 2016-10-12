# -*- coding: utf-8 -*-

"""
Some FAST endpoints implementation
"""

from __future__ import absolute_import

from flask_security import auth_token_required, roles_required
from ..base import ExtendedApiResource
from ..services.elastic import FastSearch
from .. import decorators as deck

from ... import get_logger

logger = get_logger(__name__)

PARTY_KEY = 'fete'
SOURCE_KEY = 'source'
SCRIPT_KEY = 'manuscrit'
PLACE_KEY = 'lieu'
MULTI1_KEY = 'apparato'
MULTI2_KEY = 'actions'
MULTI3_KEY = 'temps'

# UHM
DATE_SKEY = 'start_date'
DATE_EKEY = 'end_date'


class FastManage(ExtendedApiResource, FastSearch):

    @deck.apimethod
    @auth_token_required
    def delete(self, id):
        if not self.fast_remove(id):
            return self.response(obj='Failed to delete id', fail=True)
        return self.response(id)


class FastDocs(ExtendedApiResource, FastSearch):
    """ A faster search on key values of the database documents """

    @deck.apimethod
    @deck.add_endpoint_parameter(name=PARTY_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=SOURCE_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=PLACE_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=SCRIPT_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=MULTI1_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=MULTI2_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=MULTI3_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=DATE_SKEY, ptype=str)
    @deck.add_endpoint_parameter(name=DATE_EKEY, ptype=str)
    @auth_token_required
    def get(self, searchterms=None):

        if not self.get_instance():
            return self.response(obj="Connection failed", fail=True)

        #####################################
        # filters
        filters = {}
        from beeprint import pp
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
