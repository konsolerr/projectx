import requests
import json
from django.conf import settings


def make_json_query(library, fun, *args, **kwargs):
    data = json.dumps(kwargs)
    url = 'http://%s/ocpu/library/%s/R/%s/json' % (settings.OPENCPU_DOMAIN, library, fun)
    response = requests.post(url, data=data, headers={'Content-Type': 'application/json'})
    print(response.text)
    return response.json()


def make_query(library, fun, *args, **kwargs):
    url = 'http://%s/ocpu/library/%s/R/%s' % (settings.OPENCPU_DOMAIN, library, fun)
    response = requests.post(url, data=kwargs)
    return parse_response(response.text)


def parse_response(text):
    lines = text.split("\n")
    lines = filter(lambda x: x, lines)
    lines = [line.replace("/ocpu/tmp/", "") for line in lines]
    key = lines[0].split("/")[0]
    lines = [line.replace(key + "/", "") for line in lines]
    return OpenCPUSessionObject(key, lines)


def make_ocpu_query(url, data=None, headers=None):
    data = data | {}
    headers = headers | {'Content-Type': 'application/json'}
    response = requests.post(url, data=data, headers=headers)
    return parse_response(response.text)


class OpenCPUSessionObject(object):
    def __init__(self, key, keys=None):
        self.key = key
        if keys is None:
            url = 'http://%s/ocpu/tmp/%s/' % (settings.OPENCPU_DOMAIN, self.key)
            lines = requests.get(url).text.split("\n")
            keys = filter(lambda x: x, lines)
        self.keys = keys

    def get_value(self):
        val_string = 'R/.val'
        if val_string not in self.keys:
            raise ValueError("This session doesn't have 'R/.val' ")
        url = ('http://%s/ocpu/tmp/%s/' + val_string + '/json') % (settings.OPENCPU_DOMAIN, self.key)
        response = requests.get(url, headers={'Content-Type': 'application/json'})
        return response.json()

    def show_knit(self):
        return make_query('testPackage', 'showKnit', obj=self.key)

    def __str__(self):
        return "%s - %s" % (self.key, str(self.keys))

    # def __repr__(self):
    #     return