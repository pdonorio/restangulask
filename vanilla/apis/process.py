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
RETHINK_DUMP_BIN = 'rethinkdb-dump'
BACKUP_PATH = '/code/backup'
BACKUP_PREFIX = 'online_'
BACKUP_EXT = '.tar.gz'


class BaseProcess(ExtendedApiResource):

    def process_exists(self, process_name, process_base=None):

        if process_base is None:
            process_base = PYTHON_BIN_NAME

        current_pid = os.getpid()
        for pid in psutil.pids():

            if pid == current_pid or not psutil.pid_exists(pid):
                continue
            process = psutil.Process(pid)
            print(process)

            # print(process.name(), process_base)
            if process.name() == process_base:
                cmd = process.cmdline()
                # print("TEST", cmd)
                if process_name in cmd:
                    return True

        return False

    def python_launch(self, python_file, extra_args):
        from plumbum import local, BG
        pybin = local[PYTHON_BIN_NAME]
        args = [python_file]
        for arg in extra_args:
            args.append(arg)
        return pybin[args] & BG


class RethinkProcess(BaseProcess):

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

        if self.process_exists(PYTHON_FILE_NAME):
            return False

        bgproc = self.python_launch(PYTHON_FILE_NAME, ['1'])
        if bgproc.ready():
            raise BaseException("Process launch failed")
        else:
            return True


class RethinkBackup(BaseProcess):

    @deck.apimethod
    @auth_token_required
    def get(self):

        # list files
        import os
        from glob import glob
        files = glob("%s/%s*%s" % (BACKUP_PATH, BACKUP_PREFIX, BACKUP_EXT))
        names = []
        for file in files:
            name = file.replace(BACKUP_PREFIX, '').replace(BACKUP_EXT, '')
            names.append(next(reversed(name.split(os.sep))).replace('T', ' '))

        return {
            'exists': self.process_exists(
                process_name='rdb',
                process_base=RETHINK_DUMP_BIN),
            'files': names,
            # 'counter': GExReader.read_counter(),
        }

    def python_launch(self, python_file, extra_args):
        from plumbum import local, BG
        pybin = local[python_file]
        args = []
        for arg in extra_args:
            args.append(arg)
        # return pybin(args)
        return pybin[args] & BG

    @deck.apimethod
    @auth_token_required
    def post(self):

        if self.process_exists('rdb', RETHINK_DUMP_BIN):
            return False

        import datetime
        dt = datetime.datetime.utcnow().isoformat()
        name = str(dt).split('.')[0]
        filepath = '%s/%s%s%s' % (BACKUP_PATH, BACKUP_PREFIX, name, BACKUP_EXT)

        args = ['-c', 'rdb', '--file', filepath, '--overwrite']
        bgproc = self.python_launch(RETHINK_DUMP_BIN, args)
        # print(bgproc)
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
