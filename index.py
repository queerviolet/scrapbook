#!/usr/bin/env python
# Write out a JSON index of pages like so:
#
# {
#   'pages': {
#     '0001_vertical_center': [
#       'files': [
#          'index.html',
#          'style.css',
#       ],
#     }
#   }  
# }

import os
import os.path as path
import re
import sys
import json

base = sys.argv[1] if len(sys.argv) > 1 else '.'
result = {}
page_re = re.compile(r'\d+_[0-9a-zA-Z_]+')

def page(name):
  page_base = path.join(base, name)
  for root, dir, files in os.walk(page_base):
    for f in files:
      yield path.join(root, f)[len(page_base) + 1:]

print json.dumps({'pages': {p: list(page(p)) for p in os.listdir(base) if page_re.match(p)}})
