# -*- coding: utf-8 -*-

"""
Manage users (for admins)
"""

from __future__ import absolute_import
# from flask_security import auth_token_required  # , roles_required
# from confs import config
from ..base import ExtendedApiResource
# from ...models import db, User, Role, Tokenizer
# from ... import htmlcodes as hcodes
from .. import decorators as deck
from ... import get_logger

logger = get_logger(__name__)


class Manager(ExtendedApiResource):
    """ Token authentication test """

    @deck.apimethod
    def get(self):

        response = {'hello': 'world'}
        return self.response(response)
