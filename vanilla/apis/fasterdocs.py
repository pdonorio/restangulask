# -*- coding: utf-8 -*-

"""
Some FAST endpoints implementation
"""

from __future__ import absolute_import
from ..base import ExtendedApiResource
from ..services.elastic import FastSearch
from .. import decorators as deck
from ... import get_logger

logger = get_logger(__name__)

PARTY_KEY = 'fete'
SOURCE_KEY = 'source'
SCRIPT_KEY = 'manuscrit'
PLACE_KEY = 'lieu'
DATE_KEY = 'date'


class FastDocs(ExtendedApiResource, FastSearch):
    """ A faster search on key values of the database documents """

    @deck.apimethod
    @deck.add_endpoint_parameter(name=PARTY_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=SOURCE_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=PLACE_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=DATE_KEY, ptype=str)
    @deck.add_endpoint_parameter(name=SCRIPT_KEY, ptype=str)
    def get(self, searchterms=None):

        if not self.get_instance():
            return self.response(obj="Connection failed", fail=True)

        #####################################
        # filters
        filters = {}
        # from beeprint import pp
        # pp(self._args)
        filters_keys = [
            PARTY_KEY, SOURCE_KEY, PLACE_KEY, DATE_KEY, SCRIPT_KEY
        ]
        for key in filters_keys:
            tmp = self._args.get(key)
            if tmp is not None:
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
    def get(self, searchterms=None):
        self.get_instance()
        return self.response(self.fast_suggest(searchterms))
