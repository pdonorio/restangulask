# -*- coding: utf-8 -*-

"""
Some endpoints implementation
"""

from __future__ import absolute_import

import os
import re
import rethinkdb as r

from rethinkdb.net import DefaultCursorEmpty
from flask.ext.security import auth_token_required, roles_required
from confs import config
from ..services.rethink import schema_and_tables, BaseRethinkResource
from ..services.uploader import Uploader
from .. import decorators as deck
from ... import get_logger, htmlcodes as hcodes

logger = get_logger(__name__)

#####################################
# Main resource
model = 'datavalues'
mylabel, mytemplate, myschema = schema_and_tables(model)


class RethinkDataValues(BaseRethinkResource):
    """ Data values """

    schema = myschema
    template = mytemplate
    table = mylabel
    table_index = 'record'

    def get_autocomplete_data(self, q, step_number=1, field_number=1):
        """ Data for autocompletion in js """
        return q \
            .concat_map(r.row['steps']) \
            .filter(
                lambda row: row['step'] == step_number
            ).concat_map(r.row['data']) \
            .filter(
                lambda row: row['position'] == field_number
            ).pluck('value').distinct()['value']

    def single_element(self, data, details='full'):
        """ If I request here one single document """
        single = []
        for steps in data.pop()['steps']:
            title = ""
            element = {}
            for row in steps['data']:
                if row['position'] == 1:
                    title = row['value']
                    if details != 'full':
                        break
                element[row['name']] = row['value']
            if details == 'full':
                single.insert(steps['step'], element)
            else:
                single.insert(steps['step'], title)
        return single

    def filter_nested_field(self, q, filter_value,
                            filter_position=None, field_name=None):
        """
        Filter a value nested by checking the field name also
        """
        mapped = q \
            .concat_map(
                lambda doc: doc['steps'].concat_map(
                    lambda step: step['data'].concat_map(
                        lambda data:
                            [{'record': doc['record'], 'step': data}])))

        logger.debug("Searching '%s' on pos '%s' or name '%s'" %
                     (filter_value, filter_position, field_name))
        if filter_position is not None:
            return mapped.filter(
                lambda doc: doc['step']['position'].eq(filter_position).
                and_(doc['step']['value'].eq(filter_value)))
        elif field_name is not None:
            return mapped.filter(
                lambda doc: doc['step']['name'].match(field_name).
                and_(doc['step']['value'].match(filter_value)))
        else:
            return q

    @deck.add_endpoint_parameter(name='filter', ptype=str)
    @deck.add_endpoint_parameter(name='step', ptype=int, default=1)
    @deck.add_endpoint_parameter(name='key')
    @deck.add_endpoint_parameter(name='details', default='short')
    @deck.apimethod
    @auth_token_required
    def get(self, data_key=None):
        data = []
        count = len(data)
        param = self._args['filter']

        if param is not None:
            # Making filtering queries
            logger.debug("Build query '%s'" % param)
            query = self.get_table_query()

            if param == 'autocompletion':
                query = self.get_autocomplete_data(
                    query, self._args['step'])
            elif param == 'nested_filter' and self._args['key'] is not None:
                query = self.filter_nested_field(
                    query, self._args['key'], 1)

            # Execute query
            count, data = self.execute_query(query, self._args['perpage'])
        else:
            # Get all content from db
            count, data = super().get(data_key)
            # just one single ID - reshape!
            if data_key is not None:
                data = self.single_element(data, self._args['details'])

        return self.response(data, elements=count)

#####################################
# Keys for templates and submission
model = 'datakeys'
mylabel, mytemplate, myschema = schema_and_tables(model)


class RethinkDataKeys(BaseRethinkResource):
    """ Data keys administrable """

    schema = myschema
    template = mytemplate
    table = mylabel
    table_index = 'steps'

    @deck.apimethod
    @auth_token_required
    def get(self, step=None):
        count, data = super().get(step)
        return self.response(data, elements=count)

#####################################
# Keys for templates and submission
model = 'datadocs'
mylabel, mytemplate, myschema = schema_and_tables(model)


class RethinkDocuments(BaseRethinkResource):
    """ Data keys administrable """

    schema = myschema
    template = mytemplate
    table = mylabel
    table_index = 'record'

    def get_all_notes(self, q):
        return q.concat_map(
            lambda doc: doc['images'].
            has_fields({'transcriptions': True}).concat_map(
                lambda image: image['transcriptions_split'])) \
            .distinct()

    def get_filtered_notes(self, q, filter_value=None):
        """ Data for autocompletion in js """

        mapped = q.concat_map(
                lambda doc: doc['images'].has_fields(
                    {'transcriptions': True}).map(
                        lambda image: {
                            'word': image['transcriptions_split'],
                            'record': doc['record'],
                        }
                    )).distinct()

        if filter_value is not None:
            return mapped.filter(
                lambda mapped: mapped['word'].contains(filter_value))

        return mapped

    @deck.add_endpoint_parameter(name='filter')
    @deck.add_endpoint_parameter(name='key')
    @deck.apimethod
    @auth_token_required
    def get(self, document_id=None):
        data = []
        count = len(data)
        param = self._args['filter']

        query = self.get_table_query()
        if param is not None and param == 'notes':
            # Making filtering queries
            logger.debug("Build query '%s'" % param)

            if self._args['key'] is not None:
                query = self.get_filtered_notes(query, self._args['key'])
            else:
                query = self.get_all_notes(query)

        # Execute query
        if document_id is not None:
            count, data = super().get(document_id)
        else:
            count, data = self.execute_query(query, self._args['perpage'])

        return self.response(data, elements=count)

#####################################
# Keys for templates and submission
model = 'datadmins'
mylabel, mytemplate, myschema = schema_and_tables(model)


class RethinkDataForAdministrators(BaseRethinkResource):
    """ Data admins """

    schema = myschema
    template = mytemplate
    table = mylabel

    @deck.apimethod
    # @auth_token_required
    # @roles_required(config.ROLE_ADMIN)
    def get(self, id=None):
        count, data = super().get(id)
        return self.response(data, elements=count)

    @deck.apimethod
    @auth_token_required
    @roles_required(config.ROLE_ADMIN)
    def post(self):
        return super().post()

    @deck.apimethod
    @auth_token_required
    @roles_required(config.ROLE_ADMIN)
    def put(self, id):
        return super().put(id)

    @deck.apimethod
    @auth_token_required
    @roles_required(config.ROLE_ADMIN)
    def delete(self, id):
        return super().delete(id)


#####################################
# A good tests for uploading images
class RethinkImagesAssociations(BaseRethinkResource):
    """
    Fixing problems in images associations?
    """

    @deck.apimethod
    @auth_token_required
    def get(self, id=None):

        # Get the record value and the party name associated
        first = self.get_query() \
            .table('datavalues') \
            .concat_map(lambda doc: doc['steps'].concat_map(
                    lambda step: step['data'].concat_map(
                        lambda data: [{
                            'record': doc['record'], 'step': step['step'],
                            'pos': data['position'], 'party': data['value'],
                        }])
                )) \
            .filter({'step': 3, 'pos': 1}) \
            .pluck('record', 'party') \
            .group('party')['record'] \

        records_with_docs = \
            list(self.get_query()
                 .table('datadocs').has_fields('type')
                 .filter({'type': DEFAULT_DESTINATION})
                 ['record'].run())

        final = {}
        from operator import itemgetter

        for party, records in first.run().items():
            elements = set(records) - set(records_with_docs)
            if len(elements) > 0:
                # Remove the records containing the images
                ids = list(set(records) - set(records_with_docs))
                cursor = self.get_query().table('datavalues') \
                    .filter(lambda doc: r.expr(ids).contains(doc['record'])) \
                    .run()
                newrecord = []
                for obj in cursor:
                    val = obj['steps'][0]['data'][0]['value']
                    tmp = val.split('_')
                    index = 0
                    if len(tmp) > 1:
                        index = 1
                    sort = tmp[index]

                    try:
                        sortme = int(sort)
                    except:
                        sortme = -1
                    newrecord.append({
                        'sortme': sortme,
                        'value': val,
                        'record': obj['record']
                    })
                final[party] = sorted(newrecord, key=itemgetter('sortme'))
                # final[party] = list(cursor)
        return self.response(final)

        # # Join the records with the uploaded files
        # second = first.eq_join(
        #     "record", r.table('datadocs'), index="record").zip()
        # # Group everything by party name
        # cursor = second.group('party').run(time_format="raw")
        # return self.response(cursor)


##########################################
# Upload
##########################################

#####################################
# Extra function for handling the image destination
DEFAULT_DESTINATION = 'documents'
HOMEPAGE_DESTINATION = 'welcome'
SLIDES_DESTINATION = 'slides'
IMAGE_DESTINATIONS = [
    DEFAULT_DESTINATION, HOMEPAGE_DESTINATION, SLIDES_DESTINATION]


def image_destination(mydict, key_type='destination'):
    """ This is the turning point for the image future use """

    image_destination = None
    if key_type in mydict:
        image_destination = mydict[key_type]
    if image_destination not in IMAGE_DESTINATIONS:
        image_destination = DEFAULT_DESTINATION

    return image_destination

model = 'datadocs'
mylabel, mytemplate, myschema = schema_and_tables(model)


class RethinkMetaImages(BaseRethinkResource):
    """ Meta informations about uploaded documents """

    schema = myschema
    template = mytemplate
    table = mylabel

    @deck.apimethod
    #@auth_token_required
    def get(self):

        # Handling one filter
        main_key = 'filter'
        j = self.get_input(False)
        if main_key not in j:
            return self.response("This endpoint is to filter...")

        tmp = j[main_key].split(':')
        if len(tmp) != 2:
            return self.response("This endpoint is to filter...")

        filter_key, filter_value = tmp
        print("TEST", filter_key, filter_value)

        # Handling more than one filter??

        # Do rethinkdb
        records_with_docs = \
            list(self.get_query()
                 .table('datadocs').has_fields('type')
                 .filter({'type': DEFAULT_DESTINATION})
                 ['record'].run())
        return self.response(records_with_docs.pop())

    @deck.apimethod
    def post(self):
        return self.response("POST method Not implemented yet")


class RethinkUploader(Uploader, BaseRethinkResource):
    """ Uploading data and save it inside db """

    table = 'datadocs'
    ZOOMIFY_ENABLE = True

    def image_rdb_insert(self, obj):
        """
        Handle destination of the image
        inside rethinkdb documents
        """
        images = []
        key = 'record'
        key_file = 'filename'

        # Record is the main thing here
        id = self._args[key]

        # This is the turning point for the image future use
        img_destination = image_destination(self._args)
        logger.debug("Destination: %s" % img_destination)

        # Other infos
        myfile = obj['data'][key_file]
        meta = obj['data']['meta']

        # RethinkDB setup
        query = self.get_table_query()
        action = self.insert

        # I should query the database to see if this record already exists
        # And has some images
        cursor = query.filter({key: id})['images'].run()
        try:
            images = next(cursor)
            action = self.replace
        except DefaultCursorEmpty:
            pass

        # Add the image to this record
        images.append({
            key_file: myfile,
            "code": re.sub(r"\.[^\.]+$", '', myfile),
            key_file + "_type": meta['type'],
            key_file + "_charset": meta['charset']})

        # Handle the file info insertion inside rethinkdb
        record = {
            key: id,
            "images": images,
            "type": img_destination,
        }
        try:
            action(record)
            obj = {'id': id}
            logger.debug("Operation on record '%s'" % id)
        except BaseException as e:
            obj = {'Image save/update': str(e)}

        return obj

    @deck.apimethod
    #@auth_token_required
    def get(self, filename=None):
        return super(RethinkUploader, self).get(filename)

    @deck.add_endpoint_parameter(name='record', required=True)
    @deck.add_endpoint_parameter('destination', default=DEFAULT_DESTINATION)
    @deck.apimethod
# // TO FIX: use ng-flow headers to set authentication?
    #@auth_token_required
    def post(self):
        """
        Let the file be uploaded, make stats
        and do operations to the database with it.
        """

        subfolder = None
        img_destination = image_destination(self._args)
        if img_destination != DEFAULT_DESTINATION:
            subfolder = img_destination

        # Original upload
        obj, status = super(RethinkUploader, self).post(subfolder)

        # If response is success, save inside the database
        key_file = 'filename'
        if isinstance(obj, dict) and key_file in obj['data']:
            # rdb call
            obj = self.image_rdb_insert(obj)
            if 'id' not in obj:
                status = hcodes.HTTP_BAD_CONFLICT

        # Reply to user
        return self.response(obj, code=status)
