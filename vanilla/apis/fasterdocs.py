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


class FastDocs(ExtendedApiResource, FastSearch):
    """ A faster search on key values of the database documents """

    @deck.apimethod
    def get(self, searchterms=None):

        if not self.get_instance():
            return self.response(obj="Connection failed", fail=True)
        current_element, limit = self.get_paging()
        # current_page, limit = self.get_paging()
        # current_element = 1 + (current_page - 1) * limit
        data, count = self.fast_get(searchterms, current_element, limit)
        if data is None:
            return self.response(obj='Request failed', fail=True)
        return self.response(data, elements=count)


class FastSuggestion(ExtendedApiResource, FastSearch):
    """ A faster search on key values of the database documents """

    @deck.apimethod
    def get(self, searchterms=None):
        self.get_instance()
        return self.response(self.fast_suggest(searchterms))
