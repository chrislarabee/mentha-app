#!/bin/bash

set -e

# Make sure db has the most up-to-date schema on start:
# alembic upgrade head

# Execute start-reload script.
. /start-reload.sh
