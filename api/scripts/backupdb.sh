#!/bin/bash

set -e

docker exec -it mentha-app-db-1 pg_dump -U postgres -d mentha-db -f /exports/db-backup.sql
