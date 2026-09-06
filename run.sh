#!/bin/bash
# Script to activate virtual environment and start the AURA Shopping Brand Web App

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment in $SCRIPT_DIR/venv..."
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi

echo "Activating virtual environment and launching AURA Luxe Atelier server..."
export PORT=${PORT:-5000}
./venv/bin/python app.py
