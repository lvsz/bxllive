#!/bin/bash

perl -i -pe 's/(^.*choices=\[\(o.id, str\(o.name\)\) for o in Venue.objects.all\(\)\])/#$1/' webtech/forms.py
python3 manage.py makemigrations
python3 manage.py migrate
python3 manage.py loaddata testdata.json
perl -i -pe 's/^#(.*choices=\[\(o.id, str\(o.name\)\) for o in Venue.objects.all\(\)\])/$1/' webtech/forms.py

