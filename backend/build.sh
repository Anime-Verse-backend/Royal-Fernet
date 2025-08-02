#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Initializing the database..."
python init_db.py

echo "Build finished. Starting Gunicorn..."
exec gunicorn --worker-tmp-dir /dev/shm app:app
