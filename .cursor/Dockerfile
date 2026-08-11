# Cloud Agent base: PostgreSQL 17 (matches docker-compose.yml). No nested Docker.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates gnupg sudo && \
    install -d /usr/share/postgresql-common/pgdg && \
    curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc && \
    echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt noble-pgdg main" \
      > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends postgresql-17 postgresql-client-17 && \
    rm -rf /var/lib/apt/lists/* && \
    printf '%s\n' \
      'local   all   all   scram-sha-256' \
      'host    all   all   127.0.0.1/32   scram-sha-256' \
      'host    all   all   ::1/128        scram-sha-256' \
      > /etc/postgresql/17/main/pg_hba.conf && \
    echo "listen_addresses = 'localhost'" >> /etc/postgresql/17/main/postgresql.conf && \
    (id -u ubuntu &>/dev/null || useradd -m -s /bin/bash ubuntu) && \
    echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu

USER ubuntu
WORKDIR /home/ubuntu
