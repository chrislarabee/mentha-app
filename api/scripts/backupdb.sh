#!/bin/bash

set -e

docker exec -it mentha-app-db-1 pg_dump -U postgres \
    -d mentha-db -T *alembic_version* --data-only \
    -f /exports/db-backup.sql
