# Mentha API

Simple API for querying/updating the database.

## Development

### Poetry

This project uses Poetry as the package manager for the api. Installation
be found [here](https://python-poetry.org/docs/#installation).

Once installed, you can install the dependencies and set up your virtual
environment with `poetry install` in the api directory.

### Alembic

This project uses Alembic to version control our changes to the DB attached to the
api. Any changes or additions you make should be captured by an alembic version
script rather than being added directly to the database. See the README in the
alembic-mentha-db directory for more information.
