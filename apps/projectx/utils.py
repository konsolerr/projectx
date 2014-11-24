import requests
import json

def make_json_query(library, fun, *args, **kwargs):
    data = json.dumps(kwargs)
    url = 'http://127.0.1.1/ocpu/library/%s/R/%s/json' % (library, fun)
    response = requests.post(url, data=data, headers={'Content-Type': 'application/json'})
    print(response.text)
    return response.json()
