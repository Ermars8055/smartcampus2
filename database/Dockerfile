FROM postgres:17-alpine

# This folder is dedicated to your Master Database.
# The base image is the lightweight Alpine Linux version of PostgreSQL 17.

# Automatically restore the database dump when the container starts on a new server
COPY ./nissigrid_stores_dump.sql /docker-entrypoint-initdb.d/
