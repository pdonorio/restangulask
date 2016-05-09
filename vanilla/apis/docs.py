# -*- coding: utf-8 -*-

"""
Some endpoints implementation
"""

from __future__ import absolute_import

import re
import rethinkdb as r

from jinja2._compat import iteritems
from operator import itemgetter
from rethinkdb.net import DefaultCursorEmpty
from flask.ext.security import auth_token_required, roles_required
from confs import config
from ..services.rethink import schema_and_tables, BaseRethinkResource
from ..services.uploader import Uploader
from .. import decorators as deck
from ..utilities import split_and_html_strip
from ... import get_logger, htmlcodes as hcodes

logger = get_logger(__name__)


#####################################
# Tables
DOCSTABLE = 'datadocs'

#####################################
# Extra function for handling the image destination

DEFAULT_DESTINATION = 'documents'
HOMEPAGE_DESTINATION = 'welcome'
SLIDES_DESTINATION = 'slides'
IMAGE_DESTINATIONS = [
    DEFAULT_DESTINATION, HOMEPAGE_DESTINATION, SLIDES_DESTINATION]


def image_destination(mydict, key_type='destination'):
    """ This is the turning point for the image future use """

    image_destination = DEFAULT_DESTINATION
    if mydict is not None:
        image_destination = mydict.get(key_type, DEFAULT_DESTINATION)

    return image_destination


def image_subfolder(args):
    """ Evaluate subfolder for images """

    subfolder = None
    img_destination = image_destination(args)
    if img_destination != DEFAULT_DESTINATION:
        subfolder = img_destination

    logger.debug("Subfolder is %s" % subfolder)
    return subfolder

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
    sort_index = 'title'

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
    @deck.add_endpoint_parameter(name='field')
    @deck.add_endpoint_parameter(name='details', default='short')
    @deck.apimethod
    # @auth_token_required
    def get(self, data_key=None):

        args = self._args
        data = []
        count = len(data)
        param = args['filter']
        default_position = 1

        if param is not None:
            # Making filtering queries
            logger.debug("Build query '%s'" % param)
            query = self.get_table_query()

            if param == 'autocompletion':
                query = self.get_autocomplete_data(
                    query, args['step'])
            elif param == 'nested_filter' and args['key'] is not None:
                query = self.filter_nested_field(
                    query, args['key'], default_position)
            elif param == 'recover_code' and \
             args['key'] is not None and args['field'] is not None:

                query = query.get_all(args['key'], index="title")
                # query = self.filter_nested_field(
                #     query, args['key'], None, args['field'])

            # Paging
            current_page, limit = self.get_paging()
            # Execute query
            count, data = self.execute_query(query, limit)
        else:
            # Get all content from db
            count, data = super().get(data_key)
            # just one single ID - reshape json output!
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
    # @auth_token_required
    def get(self, step=None):
        count, data = super().get(step)
        return self.response(data, elements=count)

#####################################
# Documents and files that are associated to records
model = DOCSTABLE
mylabel, mytemplate, myschema = schema_and_tables(model)


class RethinkDocuments(Uploader, BaseRethinkResource):
    """ Data keys administrable """

    schema = myschema
    template = mytemplate
    table = mylabel
    table_index = 'record'
    ZOOMIFY_ENABLE = True

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
    # @auth_token_required
    def get(self, document_id=None):

        # Init
        data = []
        count = len(data)
        query = self.get_table_query()

        #################################
        # Using bad old filtering
# Note: this can be removed when switching to elasticsearch!
        param = self._args['filter']
        if param is not None and param == 'notes':
            # Making filtering queries
            logger.debug("Build query '%s'" % param)

            if self._args['key'] is not None:
                query = self.get_filtered_notes(query, self._args['key'])
            else:
                query = self.get_all_notes(query)

######################################################################
# # JSON DOES NOT WORK WITH GET METHOD....? it's in the request body
#         #################################
#         # Using new great filtering
#         else:
#             j = self.get_input(False)
#             print("TEST 1")
#             query = query.filter({'type': image_destination(j)})
#             print("TEST 2", query)
# # JSON DOES NOT WORK WITH GET METHOD....? it's in the request body
######################################################################

        #################################
        # Execute query
        if document_id is not None:
            count, data = super().get(document_id)
        else:
            current_page, limit = self.get_paging()
            count, data = self.execute_query(query, limit)

        return self.response(data, elements=count)

    @deck.apimethod
    # @auth_token_required
    def post(self):
        """
        Not a real POST method at the moment...
        Used for searching with json filter for now!
        """
        query = self.get_table_query()

        #################################
        # Using new great filtering
        j = self.get_input(False)
        query = query.filter({'type': image_destination(j)})

        #################################
        # Execute query
        current_page, limit = self.get_paging()
        count, data = self.execute_query(query, limit)
        return self.response(data, elements=count)

    @deck.add_endpoint_parameter('destination', default=DEFAULT_DESTINATION)
    @deck.apimethod
    @auth_token_required
    def put(self, document_id):

        subfolder = image_subfolder(self.get_input(False))

        # Update document inside the database
        rdbout = super().put(document_id, index='record')
        # print("Output", rdbout)
        changes = rdbout['changes'].pop()
        # print("Changes", changes)

        # Should remove the image/file if there is one less
        if rdbout['replaced'] > 0:
            old = changes['old_val']['images']
            new = changes['new_val']['images']

            # Compare this two lists.
            # There should be one less maximum, probably.
            # http://stackoverflow.com/a/19755464/2114395
            import itertools
            missing = list(itertools.filterfalse(lambda x: x in new, old))
            # print("Compare", old, new, missing)
            logger.debug("Found missing: '%s'" % missing)
            for item in missing:
                if 'filename' in item:
                    logger.info("Remove useless file %s "
                                % item['filename'])
                    obj, status = super().remove(item['filename'], subfolder)
                    # print("Deleted?", obj, status)

        return changes

#####################################
# Administration profile
model = 'datadmins'
mykey = 'type'
mylabel, mytemplate, myschema = schema_and_tables(model)


# @deck.enable_endpoint_identifier('id')
# above is not necessary because i specify this on the .ini configuration
class RethinkDataForAdministrators(BaseRethinkResource):
    """ Data admins """

    schema = myschema
    template = mytemplate
    table = mylabel

    @deck.add_endpoint_parameter(mykey)
    @deck.apimethod
    # This method should be public
    # to show sections in the welcome page to unlogged users
    # @auth_token_required
    def get(self, id=None):

        type = image_destination(self._args, key_type=mykey)
        table1 = self.get_table_query()
        table2 = r.table(DOCSTABLE)

        query = table1.filter({mykey: type}) \
            .outer_join(table2, lambda sections, images:
                        sections['id'] == images['record']) \
            .zip() \
            .filter({mykey: type})

        count, data = self.execute_query(query)
        # count, data = super().get(id)
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
class RethinkGrouping(BaseRethinkResource):
    """ Associate parties to records """

    def group_query(self, id=None):
        """ Get the record value and the party name associated """
        return self.get_query() \
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
            .group('party')['record']

    def subtract_documents(self, to_remove, record_list=False):

        final = {}
        if record_list:
            final = []

        for party, records in self.group_query().run().items():

            elements = set(records) - to_remove

            if len(elements) > 0:

                # Remove the records containing the images
                query = self.get_query().table('datavalues') \
                    .filter(lambda doc: r.expr(list(elements))
                            .contains(doc['record']))

                if not record_list:
                    # Sort the list in a way we can use it on the interface
                    newrecord = []
                    for obj in query.run():

                        val = obj['steps'][0]['data'][0]['value']

                        # Sort from the number value
                        tmp = val.split('_')
                        index = 0
                        offset = 0
                        if len(tmp) > 1:
                            index = len(tmp) - 1
                            offset = 1000
                        try:
                            sort_value = int(tmp[index]) + offset
                        except:
                            sort_value = -1

                        newrecord.append({
                            'sortme': sort_value,
                            'value': val,
                            'record': obj['record']
                        })
                    final[party] = sorted(newrecord, key=itemgetter('sortme'))
                else:
                    final += list(query['record'].run())

        return final

    def records_missing_images(self, record_list=False):
        records_with_docs = \
            list(self.get_query()
                 .table(DOCSTABLE)
                 .filter({'type': DEFAULT_DESTINATION})
                 ['record'].run())
        return self.subtract_documents(set(records_with_docs), record_list)


#####################################
# A good tests for uploading images
class RethinkImagesAssociations(RethinkGrouping):
    """ Help in fixing problems in images associations """

    @deck.apimethod
    @auth_token_required
    def get(self, id=None):
        final = self.records_missing_images()
        return self.response(final)


#####################################
# A good tests for writing with text editor
class RethinkTranscriptsAssociations(RethinkGrouping):
    """ For missing transcription associations """

    @deck.apimethod
    @auth_token_required
    def get(self, id=None):

        records_with_no_images = self.records_missing_images(record_list=True)

        records_with_trans = \
            list(self.get_query()
                 .table(DOCSTABLE).concat_map(
                    lambda obj: obj['images'].has_fields('transcriptions'))
                 ['recordid']
                 .run())

        # I need the union of the previous sets
        records = set(records_with_trans) | set(records_with_no_images)
        # I want to skip record which already have transcriptions
        # But also want to avoid records which have no images

        # final = self.subtract_documents(set(records))
# SHOW ALL BECAUSE WE PASSED THAT PHASE
        final = self.subtract_documents(set())
        return self.response(final)

    @deck.apimethod
    # @auth_token_required
    def put(self, id):

        j = self.get_input(False)
        if 'trans' not in j:
            return self.response({}, code=hcodes.HTTP_OK_NORESPONSE)
        # print("Id", id, "Received", j)

        # def merge_dicts(a, b):
        #     print("MERGE", a, b)
        #     z = a.copy()
        #     z.update(b)
        #     print("MERGED", z)
        #     return z

        base_query = self.get_table_query(DOCSTABLE).get(id)
        data = base_query.run().copy()
        image = data['images'].pop()

        key = 'transcriptions'
        image[key] = [j['trans']]

# # TO FIX: substitute with elastic search
#         words = set()
#         for trans in image[key]:
#             words = words | split_and_html_strip(trans)
#         image[key+'_split'] = list(words)

        print(image)
        changes = base_query.update({
            'images': [image]
        }, return_changes=True).run(time_format="raw")

        return self.response(changes)


##########################################
# The end is the beginning is the end
##########################################
class RethinkElement(BaseRethinkResource):
    """ Meta informations about uploaded documents """

    table = 'datavalues'

    @deck.apimethod
    def get(self):

        cursor = self.get_table_query().run()

        data = {}
        sources = {}
        for obj in cursor:

            tmp = {}
            name = None
            source_name = None
            for step in obj['steps']:
                if step['step'] == 2:
                    source_name = step['data'][0]['value']
                if step['step'] == 3:
                    for element in step['data']:
                        # print(element)
                        if element['value'].strip() == '':
                            element['value'] = '-'
                        if element['position'] == 1:
                            name = element['value']
                        tmp[element['name']] = element['value']

            if source_name is not None:
                if name not in sources:
                    sources[name] = []
                try:
                    sources[name].index(source_name)
                except:
                    sources[name].append(source_name)

            # tmp['Titre abrégé de la source'] = source_name
            flag = True
            if name in data:
                if (len(data[name]) > len(tmp)):
                    flag = False
            if flag:
                data[name] = tmp

        for key, values in data.items():
            data[key]['Titre abrégé de la source'] = sources[key]

        return self.response(data)


##########################################
# Upload
##########################################
model = DOCSTABLE
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

        q = self.get_table_query()

        # Handling more than one filter
        for key, value in iteritems(j[main_key]):
            q = q.has_fields(key).filter({key: value})

        # Do rethinkdb
        cursor = q.run(time_format="raw")

        return self.response(list(cursor))

    @deck.apimethod
    def post(self):
        return self.response("POST method Not implemented yet")


class RethinkUploader(Uploader, BaseRethinkResource):
    """ Uploading data and save it inside db """

    table = model
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
            logger.debug("RethinkDB pushing '%s'" % record)
            action(record)
            obj = {'id': id}
            logger.debug("Obtained RethinKDB record '%s'" % id)
        except r.errors.ReqlDriverError as e:
            error = str(e)
            logger.critical("RethinkDB failed insert/update:\n%s" % error)
            obj = {'Image save/update': error}

        return obj

    @deck.add_endpoint_parameter('destination', default=DEFAULT_DESTINATION)
    @deck.apimethod
    def get(self, filename=None):

        # Forward GET method from flow chunks, to POST method
        return self.response("Go to POST", code=hcodes.HTTP_OK_NORESPONSE)

        # subfolder = image_subfolder(self._args)

        # return super(RethinkUploader, self).download(
        #     filename,
        #     subfolder=subfolder,
        #     # To allow chunks.
        #     # View / Download is provided with server static dir
        #     get=False)

    @deck.add_endpoint_parameter('destination', default=DEFAULT_DESTINATION)
    @deck.add_endpoint_parameter(name='record', required=True)
    @deck.apimethod
# // TO FIX: use ng-flow headers to set authentication?
    #@auth_token_required
    def post(self):
        """
        Let the file be uploaded, make stats
        and do operations to the database with it.
        """

        # Original upload
        subfolder = image_subfolder(self._args)
        obj, status = super(RethinkUploader, self).upload(subfolder)

        # If response is success, save inside the database
        key_file = 'filename'
        if isinstance(obj, dict) and key_file in obj['data']:
            # rdb call
            obj = self.image_rdb_insert(obj)
            if 'id' not in obj:

# // TO FIX: remove if fail to insert inside database
                status = hcodes.HTTP_BAD_CONFLICT

        # Reply to user
        return self.response(obj, code=status)
