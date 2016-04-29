# -*- coding: utf-8 -*-

"""
Some FAST endpoints implementation
"""

from __future__ import absolute_import
from ..base import ExtendedApiResource
from ..services.elastic import FastSearch
from ... import get_logger

logger = get_logger(__name__)


class FastDocs(ExtendedApiResource, FastSearch):
    """ A faster search on key values of the database documents """

    def get(self, record=None):

        es = self.get_instance()
        logger.info("es %s" % es._api.info())
        return self.response(['Hello ES'])
