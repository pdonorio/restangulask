# -*- coding: utf-8 -*-

"""
Manage users (for admins)
"""

from __future__ import absolute_import
from flask_security import auth_token_required  # , roles_required
# from confs import config
from ..base import ExtendedApiResource
from ...models import User  # , db, Role, Tokenizer
# from ... import htmlcodes as hcodes
from .. import decorators as deck
from ... import get_logger

logger = get_logger(__name__)


class Manager(ExtendedApiResource):
    """ Token authentication test """

    @deck.apimethod
    @auth_token_required
    def get(self):

        users = User.query.all()
        response = []
        for user in users:
            print(user.__dict__)
            roles = []
            for role in user.roles:
                roles.append(role.name)
            response.append({
                'email': user.email,
                'name': user.first_name,
                'surname': user.last_name,
                'roles': roles,
            })

        return self.response(response)
