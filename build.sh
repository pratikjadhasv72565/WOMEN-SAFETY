#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Run migrations and collect static files
python SheSafe/manage.py collectstatic --no-input
python SheSafe/manage.py migrate
