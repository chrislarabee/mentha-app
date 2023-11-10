FROM tiangolo/uvicorn-gunicorn-fastapi:python3.11

RUN apt update && apt install python3-dev build-essential pkg-config -y

# # Install Poetry
RUN curl -sSL https://install.python-poetry.org/ | POETRY_HOME=/opt/poetry python && \
    cd /usr/local/bin && \
    ln -s /opt/poetry/bin/poetry && \
    poetry config virtualenvs.create false

# # Copy using poetry.lock* in case it doesn't exist yet
COPY ./pyproject.toml ./poetry.lock* /app/ 

RUN poetry install --no-root 

COPY ./app /app/app