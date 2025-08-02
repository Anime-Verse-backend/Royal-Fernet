#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Initializing the database..."
python init_db.py

echo "Iniciando backend..."
python app.py 

echo "Build finished."
