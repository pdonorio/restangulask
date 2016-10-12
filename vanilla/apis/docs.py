# -*- coding: utf-8 -*-

"""
Some endpoints implementation
"""

from __future__ import absolute_import

import os
import re
import time
import rethinkdb as r
from beeprint import pp
import timestring
import shutil

from collections import OrderedDict
from jinja2._compat import iteritems
from operator import itemgetter
from rethinkdb.net import DefaultCursorEmpty
from flask_security import auth_token_required, roles_required
from confs import config
from ..services.rethink import schema_and_tables, BaseRethinkResource
from ..services.elastic import FastSearch
from ..services.uploader import Uploader
from .. import decorators as deck
# from ..utilities import split_and_html_strip
from ... import get_logger, htmlcodes as hcodes

logger = get_logger(__name__)


#####################################
DOCSTABLE = 'datadocs'
TRASH_DIR = 'mytrash'

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
            ).order_by('value').pluck('value').distinct()['value']

    def single_element(self, data, details='full'):
        """ If I request here one single document """

        single = []
        if len(data) < 1:
            return single

        friend = data.pop()
        if 'steps' not in friend:
            return single
        for i in range(0, 4):
            single.insert(i, {})

        for steps in friend['steps']:
            title = ""
            element = {}
            for row in steps['data']:
                if row['position'] == 1:
                    title = row['value']
                    if details != 'full':
                        break
                element[row['name']] = ''
                if 'values' in row:
                    element[row['name']] = row['values']
                elif 'value' in row:
                    element[row['name']] = row['value']

            # print("TEST STEP", steps)
            pos = int(steps['step']) - 1
            if details == 'full':
                single[pos] = element
            else:
                single[pos] = title

        # print("TEST", single)
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
    @deck.add_endpoint_parameter(name='position', ptype=int, default=1)
    @deck.add_endpoint_parameter(name='key')
    @deck.add_endpoint_parameter(name='field')
    @deck.add_endpoint_parameter(name='details', default='short')
    @deck.apimethod
    @auth_token_required
    def get(self, data_key=None):

        if data_key == 'draft':
            return 'drafting'

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
                    query, args['step'], args['position'])

            elif param == 'basefastsearch':

                # from 'autocomplete'
                _, sources = self.execute_query(
                    self.get_autocomplete_data(query, 2, 1))
                _, manuscrits = self.execute_query(
                    self.get_autocomplete_data(query, 2, 2))
                _, fetes = self.execute_query(
                    self.get_autocomplete_data(query, 3, 1))
                _, lieus = self.execute_query(
                    self.get_autocomplete_data(query, 3, 5))

                # multisteps
                multi = self.get_table_query('stepstemplate')
                exq = self.execute_query

                def manage_filter_query(data):
                    _, tmp = data
                    data = tmp.pop()['extra'].strip('.').split(', ')
                    data.sort()
                    return data

                actions = manage_filter_query(
                    exq(multi.filter({'step': 4, 'position': 4})))
                temps = manage_filter_query(
                    exq(multi.filter({'step': 4, 'position': 3})))
                apparatos = manage_filter_query(
                    exq(multi.filter({'step': 4, 'position': 6})))

                return self.response({
                    'sources': sources,
                    'manuscrits': manuscrits,
                    'fetes': fetes,
                    'lieus': lieus,
                    'apparatos': apparatos,
                    'actions': actions,
                    'temps': temps,
                })

            elif param == 'nested_filter' and args['key'] is not None:
                query = self.filter_nested_field(
                    query, args['key'], default_position)

            elif param == 'recover_code' \
               and args['key'] is not None and args['field'] is not None:

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

    @deck.apimethod
    @auth_token_required
    def put(self, data_key=None):

        # Create a key for drafts
        if data_key == 'draft':
            cursor = self.get_table_query().insert({}).run()
            data_key = dict(cursor)['generated_keys'].pop()

        query = self.get_table_query().get(data_key)
        json_req = self.get_input(False)

        # print("TEST", data_key, query, json_req)
        element = query.run()
        # print(element)

        empty = True
        if 'steps' in element:
            for i in range(0, len(element['steps'])):
                if (int(json_req['step']) == int(element['steps'][i]['step'])):
                    # print("single", i, element['steps'][i])
                    element['steps'][i] = json_req
                    empty = False
                    break
        else:
            element['steps'] = []

        if empty:
            # print("EMPTY", json_req['step'])
            # element['step'] = json_req['step']
            element['steps'].append(json_req)

# NOTE: TODO elasticsearch update
# I should use the same id from rethinkdb also to elasticsearch

        # Update rethinkdb element
        query.update(element).run()
        return data_key

    def remove_image(self, file):
        full_path = Uploader.absolute_upload_file
        abs_file = full_path(file)
        zoom_dir, fileext = os.path.splitext(abs_file)
        # Move to trash
        try:
            # Remove zoom
            if os.path.exists(zoom_dir):
                shutil.rmtree(zoom_dir)
                logger.debug("Removing zoom %s" % zoom_dir)
            if os.path.exists(abs_file):
                os.remove(abs_file)
                logger.debug("Removing file %s" % abs_file)
        except Exception as e:
            logger.warning("Something wrong removing %s\n%s" % (abs_file, e))
            return False
        return True

    @deck.apimethod
    @auth_token_required
    def delete(self, data_key=None):

        query = self.get_table_query("datadocs").get(data_key)
        data = query.run()

        # Remove data values
        query.delete().run()
        # Remove data docs
        self.get_table_query("datadocs").get(data_key).delete().run()
        logger.info("Removed from rethink")
        # Remove image
        if isinstance(data, dict) and 'images' in data:
            for image in data['images']:
                if 'filename' in image:
                    self.remove_image(image['filename'])
        # Remove catalogue cache
        FastSearch().fast_remove(data_key)
        logger.info("Removed from elastic")

        return "Hello World"


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
    @auth_token_required
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

            logger.critical("\n\nSHOULD NOT BE USED!!!\n\n")
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
    @auth_token_required
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
class RethinkExpo(BaseRethinkResource):

    table = "datadocs"
    _type = 'expo'

    @deck.apimethod
    @auth_token_required
    def get(self, id=None):

        data = {}
        sections = {}
        public = {}
        only_images = {}
        covers = {}
        thumbsid = {}

        original_data = list(self.get_table_query(self._type).run())

        for element in original_data:
            # print(element)
            current_section = element['section']
            if 'cover' in element:
                covers[element['cover']] = current_section
            sections[current_section] = []
            public[current_section] = {}

            thumbs = OrderedDict()

            for current_theme, ids in element['themes'].items():

                images = OrderedDict()
                sections[current_section].append(current_theme)

                for uuid in ids:
                    doc = self.get_table_query().get(uuid).run()
                    if doc is None:
                        continue
                    image = doc['images'].pop()
                    path = os.path.join(self._type, image['code'])
                    filepath = os.path.join(self._type, image['filename'])
                    key = doc['details'].pop('position')

                    images[key] = {}
                    images[key]['details'] = doc['details']
                    images[key]['filename'] = filepath
                    images[key]['thumb'] = path
                    images[key]['_id'] = uuid

                    # thumbs[key] = path
                    thumbs[key] = filepath
                    thumbsid[uuid] = filepath

                    element = {
                        'id': uuid,
                        'section': current_section,
                        'theme': current_theme,
                        'details': doc['details'],
                        'name': image['code'],
                        'file': path,
                    }
                    data[uuid] = element
                    only_images[uuid] = element

                if len(images) > 0:
                    public[current_section][current_theme] = images

            if len(public[current_section]) < 1:
                public.pop(current_section)
            else:
                for key in sorted(thumbs):
                    public[current_section]['cover'] = thumbs[key]
                    break

        # Only images
        if id == '_all':
            return self.response(only_images)

        # Only sections
        if id == '_sections':
            return self.response(sections)

        # Data with no partial images
        if id is None:
            # Fix cover if existing
            for element in original_data:
                if 'cover' in element:
                    public[element['section']]['cover'] = \
                        thumbsid[element['cover']]
            return self.response(public, elements=len(public))

        # Load what is missing (images with no sections data)
        table = self.get_table_query()
        query = \
            table.filter({mykey: self._type}) \
            .order_by("latest")

        count, images = self.execute_query(query)
        # print("TEST", covers)

        # Remapping data for admin purpose

        now = int(time.time())
        for key, _ in data.items():
            if key in covers:
                data[key]['cover'] = 1
            else:
                data[key]['cover'] = 0
            data[key]['order'] = now * 9
            data[key]['published'] = True
        newdata = OrderedDict(data)

        for doc in images:
            # print("IMAGE\n\n", doc)
            uuid = doc['record']
            if uuid not in newdata:
                # print("TO BE ADDED")
                code = doc['images'].pop()['code']
                newdata[uuid] = {
                    'id': uuid,
                    'published': False,
                    'name': code,
                    'file': os.path.join(self._type, code),
                }
                if 'latest' in doc:
                    newdata[uuid]['order'] = int(doc['latest']) * 1
                else:
                    newdata[uuid]['order'] = now * 2

        # reverse for starting with the last one
        data = OrderedDict(reversed(list(newdata.items())))

        return self.response(data, elements=len(data))

    @deck.apimethod
    @auth_token_required
    def post(self):

        data = {'Hello': 'World'}
        j = self.get_input(False)
        # print("TEST", j)

        section = j['options']['section']
        theme = j['options']['theme']
        id = j['options']['id']

        query = self.get_table_query()
        original = query.get(id).run()
        print("original", original['details'])

        query2 = self.get_table_query(self._type)
        secdata = list(query2.filter({'section': section}).run()).pop()

        q = query.filter({mykey: self._type})
        for element in q.run():
            if 'details' in element or 'images' not in element:
                continue
            if element['images'][0]['filename'] == j['name']:
                # update new element
                query.get(element['record']) \
                    .update({'details': original['details']}).run()
                # remove old one
                query.get(id).delete().run()
                # fix the section/theme
                secdata['themes'][theme].remove(id)
                secdata['themes'][theme].append(element['record'])
                if secdata['cover'] == id:
                    secdata['cover'] = element['record']
                query2.get(secdata['id']).replace(secdata).run()
                break

        return self.response(data, elements=len(data))

    @deck.apimethod
    @auth_token_required
    def put(self, id):

        table = self.get_table_query(self._type)
        j = self.get_input(False).pop(self._type)
        # print("RECEIVED", j, table)
        itsnew = "ADD NEW ELEMENT"

        ######################################
        # Update expo tree
        # (sezione > tema > lista immagini)
        cover = j.pop("cover")

        ##########
        # Section
        sec = j.pop("section").strip()
        if sec == itsnew:
            newsec = j.pop("newsection").strip()
            if newsec != '':
                sec = newsec

        ##########
        # Theme
        theme = j.pop("theme").strip()
        if theme == itsnew:
            newtheme = j.pop("newtheme").strip()
            if newtheme != '':
                theme = newtheme

        # we could associate the same image to more themes...
        # Should be removed from where it is now
        for element in table.run():
            for current_theme, ids in element['themes'].items():
                if id in ids:
                    if element['section'] != sec or theme != current_theme:
                        element['themes'][current_theme].remove(id)
                        table.get(element['id']).update(
                            {'themes': element['themes']}).run()

                        logger.debug("Removed from %s/%s" %
                                     (element['section'], current_theme))

        # Check if section exists on rethink
        out = list(table.filter({'section': sec}).run())
        section_id = None
        if len(out) > 0:
            section_id = out.pop()['id']
        else:
            # otherwise add as empty array
            changes = table.insert({'section': sec, 'themes': {}}).run()
            section_id = changes['generated_keys'].pop()
        logger.debug("Expo section is %s" % section_id)
        section_query = table.get(section_id)
        section = section_query.run()

        # Check if exists on rethink
        if theme not in section['themes']:
            section['themes'][theme] = []

        # Append image to Theme list
        if id not in section['themes'][theme]:
            section['themes'][theme].append(id)

        # Update rethink
        changes = section_query.update({'themes': section['themes']}).run()
        logger.debug(changes)

        # Do something with the cover
        if cover:
            section_query.update({"cover": id}).run()
            # print("TEST COVER", cover, sec, j, id)

        ######################################
        # Update image info

        # print(test, id, section, "\nREMAINING", j['details'])
        query = self.get_table_query().get(id)
        key = 'details'
        changes = query.update({key: j[key]}).run()
        logger.debug(changes)

        # query = table.filter({mykey: self._type})
        # count, data = self.execute_query(query)
        # return self.response(data, elements=count)

        return self.response("Hello")

    def delete(self, id):

        # Remove from expo
        table = self.get_table_query(self._type)
        for element in table.run():
            for current_theme, ids in element['themes'].items():
                if id in ids:
                    element['themes'][current_theme].remove(id)
                    table.get(element['id']).update(
                        {'themes': element['themes']}).run()
                    logger.debug("Removed from %s/%s" %
                                 (element['section'], current_theme))

        # Remove from docs
        doc = self.get_table_query().get(id).run()
        super().delete(id, index='record')

        # Remove from FS
        up = Uploader()
        up.ZOOMIFY_ENABLE = True
        up.remove(
            doc['images'].pop()['filename'],
            skip_response=True,
            subfolder=self._type)

        return self.response("Hello")


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
    @auth_token_required
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
            .has_fields("steps") \
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
                    .has_fields("steps") \
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
    @auth_token_required
    def put(self, id):

        j = self.get_input(False)
        key_base = 'transcription'
        key_translate = 'translation'
        if key_base not in j:
            return self.response({}, code=hcodes.HTTP_OK_NORESPONSE)
        # print("Id", id, "Received", j)

        base_query = self.get_table_query(DOCSTABLE).get(id)
        data = base_query.run().copy()
        image = data['images'].pop()

        # If translation
        if j[key_translate]:
            if key_translate + 's' not in image:
                image[key_translate + 's'] = {}
            # Set the language
            image[key_translate + 's'][j['language']] = j[key_base]
        else:
            image[key_base + 's'] = [j[key_base]]
            # Set the language
            image['language'] = j['language']

# // TO FIX:
    # Update elastic search?
        # print(image)
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

        documents = {}
        cursor = self.get_query().table('datadocs').run()
        for element in cursor:
            id = element['record']
            if len(element['images']) < 1:
                continue
            image = element['images'].pop(0)
            documents[id] = image['code']
            # documents[id] = image['filename']

        cursor = self.get_table_query().run()
        pattern = re.compile(r'[0-9]+')

        data = {}
        sources = {}
        extraits = {}
        for obj in cursor:

            tmp = {}
            details = {
                'Temps': '-',
                'Actions': '-',
                'Apparato': '-'
            }
            name = None
            source_name = None
            for step in obj['steps']:
                if step['step'] == 1:
                    for element in step['data']:
                        if element['position'] == 2:
                            m = pattern.findall(element['value'])
                            details['page'] = 0
                            if len(m) > 0:
                                details['page'] = int(m[0])
                            details['record'] = obj['record']
                            # else:
                            break

                if step['step'] == 2:
                    source_name = step['data'][0]['value']
                if step['step'] == 3:
                    for element in step['data']:
                        if element['value'].strip() == '':
                            element['value'] = '-'
                        if element['position'] == 1:
                            name = element['value']
                        tmp[element['name']] = element['value']
                if step['step'] == 4:
                    for element in step['data']:
                        if isinstance(element['value'], list):
                            element['value'] = " ".join(element['value'])
                        if element['value'] is not None and \
                          element['value'].strip() == '':
                            element['value'] = '-'
                        if element['name'] == 'Temps':
                            details[element['name']] = element['value']
                        if element['name'] == 'Actions' or \
                          element['name'] == 'Actions libres':
                            if element['value'] is not None:
                                if details['Actions'] == '-':
                                    details['Actions'] = element['value']
                                else:
                                    details['Apparato'] += " " + element['value']
                        if element['name'] == 'Apparato' or \
                          element['name'] == 'Apparato libres':
                            if element['value'] is not None:
                                if details['Apparato'] == '-':
                                    details['Apparato'] = element['value']
                                else:
                                    details['Apparato'] += " " + element['value']

            details['filename'] = None
            if obj['record'] in documents:
                details['filename'] = documents[obj['record']]

            if name not in extraits:
                extraits[name] = []
            extraits[name].append(details)

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

# SHOULD SORT BY PAGE NUMBER

        for key, values in data.items():
            data[key]['Titre abrégé de la source'] = sources[key]
            # from operator import itemgetter
            # dsorted = sorted(extraits[key], key=itemgetter('page'))
            # print("Sorted\n", dsorted)
            # # print(extraits[key])
            data[key]['extrait'] = extraits[key]

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
    @auth_token_required
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
        if id == 'GENERATE':
            import uuid
            id = str(uuid.uuid4())

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
            "latest": time.time(),
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
    # @auth_token_required
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
    # @auth_token_required
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


class RethinkUpdateImages(BaseRethinkResource):
    # @deck.add_endpoint_parameter('file')
    @deck.apimethod
## // TO FIX:
# didn't make flow upload work with authentication
    # @auth_token_required
    def post(self):

        j = self.get_input(True)

        id = j['id']
        file = j['file']

        query = self.get_table_query("datadocs")
        original = query.get(id).run()
        # pp(original)

        q = query.filter({'type': 'documents'})
        tmp = {}
        for element in q.run():
            if 'images' not in element:
                continue
            if element['images'][0]['filename'] == file:
                # print("FOUND", element, file)
                tmp = element['images'][0]
                # remove old one(s)
                query.get(element['record']).delete().run()
                logger.debug("Removed temporary %s" % element['record'])

        if len(tmp) < 1:
            return self.response("Something went wrong...", fail=True)

        images = original['images']
        # In case we are reuploading the same file
        if images[0]['filename'] != tmp['filename']:
            self.trash(file=images[0]['filename'])
        else:
            logger.info("Uhm, same file?")

        # change current values to new ones
        images[0]['filename'] = tmp['filename']
        images[0]['code'] = tmp['code']
        images[0]['filename_type'] = tmp['filename_type']

        # Update rethinkdb
        query.get(id).update({'images': images}).run()
        logger.info("Updated db %s" % id)

        # Update elasticsearch...
        FastSearch().fast_update(id=id, data=tmp['filename'], image=True)

        return self.response(id)

    def trash(self, file):

        full_path = Uploader.absolute_upload_file
        trash_dir = full_path(TRASH_DIR)

        # Create trash directory if not exists
        if not os.path.exists(trash_dir):
            os.mkdir(trash_dir)
            logger.debug("Created trash %s" % trash_dir)

        # Prefix for new name is timestamp/date
        prefix = timestring.now().format('%y%m%d')
        newfile = '%s_%s' % (prefix, file)
        abs_file = full_path(file)
        zoom_dir, fileext = os.path.splitext(abs_file)

        # Move to trash
        try:
            # Remove zoom
            if os.path.exists(zoom_dir):
                shutil.rmtree(zoom_dir)
                logger.debug("Removing zoom %s" % zoom_dir)
            if os.path.exists(abs_file):
                shutil.move(abs_file, full_path(newfile, subfolder=TRASH_DIR))
                logger.info("Moved %s to trash as %s" % (abs_file, newfile))
            else:
                logger.critical("Missing original file %s" % abs_file)
        except Exception as e:
            logger.warning("Could not move file %s to trash:\n%s" % (file, e))
            return False

        return True


class RethinkStepsTemplate(BaseRethinkResource):
    """ Data keys administrable """

    table = 'stepstemplate'
    # table_index = 'steps'

    @deck.apimethod
    @auth_token_required
    def get(self, step=None):
        query = self.get_table_query()
        if step is not None:
            query = query.filter({'step': int(step)})
        count, data = self.execute_query(query)
        return self.response(data, elements=count)

    @deck.apimethod
    @auth_token_required
    def post(self, step=None):
        j = self.get_input(False)
        q = self.get_table_query()
        query = q.filter({
            'step': j.get('step'),
            'position': j.get('position')
        })
        count, data = self.execute_query(query)
        return self.response(data, elements=count)


class RethinkExpoDescription(BaseRethinkResource):
    """ Data keys administrable """

    table = 'expodesc'

    @deck.apimethod
    @auth_token_required
    def get(self):
        query = self.get_table_query()
        # if step is not None:
        #     query = query.filter({'step': int(step)})
        count, data = self.execute_query(query)
        return self.response(data, elements=count)

    @deck.apimethod
    @auth_token_required
    def put(self, mode):
        j = self.get_input(False)
        q = self.get_table_query()
        exists = list(q.filter({'mode': mode}).run())
        # print("TEST", mode, j, exists, len(exists))

        query = None
        doc = {
            'mode': mode,
            'text': j['text'],
        }

        if len(exists) < 1:
            query = q.insert(doc)
        else:
            element = exists.pop()
            doc['id'] = element['id']
            query = q.get(doc['id']).replace(doc)
            # print("element", element, query)
        query.run()

        return self.response("Hello")
