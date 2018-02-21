# -*- coding: utf-8 -*-

"""
Some FAST endpoints implementation
"""

from __future__ import absolute_import
import os
import psutil

from ..base import ExtendedApiResource
from flask_security import auth_token_required  # , roles_required
from .. import decorators as deck
# from beeprint import pp
from ... import get_logger

logger = get_logger(__name__)
PYTHON_BIN_NAME = 'python3.6'
PYTHON_FILE_NAME = 'operations.py'


class RethinkProcess(ExtendedApiResource):

    def process_exists(self, process_name):

        current_pid = os.getpid()
        for pid in psutil.pids():

            if pid == current_pid or not psutil.pid_exists(pid):
                continue
            process = psutil.Process(pid)
            # print(process)

            if process.name() == PYTHON_BIN_NAME:
                cmd = process.cmdline()
                if process_name in cmd:
                    return True

        return False

    def process_launch(self, python_file, extra_args):
        from plumbum import local, BG
        pybin = local[PYTHON_BIN_NAME]
        args = [python_file]
        for arg in extra_args:
            args.append(arg)
        return pybin[args] & BG

    @deck.apimethod
    @auth_token_required
    def get(self):
        from operations.gxls import GExReader
        return {
            'exists': self.process_exists(PYTHON_FILE_NAME),
            'counter': GExReader.read_counter(),
        }

    @deck.apimethod
    @auth_token_required
    def post(self):

        # How to launch?
        if self.process_exists(PYTHON_FILE_NAME):
            return False

        bgproc = self.process_launch(PYTHON_FILE_NAME, ['1'])
        if bgproc.ready():
            raise BaseException("Process launch failed")
        else:
            return True


# class RethinkUsers(ExtendedApiResource):

#     @deck.apimethod
#     # @auth_token_required
#     def get(self, id=None):
#         # from ..models import db, User, Role, Tokenizer
#         from ...models import User
#         cursor = User.query.all()
#         for user in cursor:
#             print("TEST", user.email)

#         return 'Hello world!'
