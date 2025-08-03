#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Initializing the database..."
python init_db.py

echo "Database initialized. Starting Gunicorn..."
# The port is automatically set by Render.
# The worker-tmp-dir is a fix for some file system issues on Render.
exec gunicorn --worker-tmp-dir /dev/shm --config gunicorn.conf.py app:app
