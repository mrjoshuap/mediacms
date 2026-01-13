############ BUILD IMAGE (for Bento4 Python script and Python packages) ############
FROM python:3.13-alpine AS build-image

# Update installed packages and clean cache
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Install system dependencies needed for building Bento4 and Python packages
RUN apk add --no-cache \
    git \
    cmake \
    make \
    g++ \
    gcc \
    musl-dev \
    libffi-dev \
    postgresql-dev \
    pkgconf \
    zlib-dev \
    libxml2-dev \
    libxslt-dev \
    xmlsec-dev \
    imagemagick-dev \
    && rm -rf /var/cache/apk/*

# Get target architecture
ARG TARGETARCH
ARG TARGETPLATFORM

# Clone Bento4 source to get mp4-hls.py Python script
# We only need the Python script, not the full build
RUN git clone -b v1.6.0-637 https://github.com/axiomatic-systems/Bento4.git /tmp/bento4 && \
    mkdir -p /home/mediacms.io/bento4/utils && \
    cp -r /tmp/bento4/Source/Python/utils/* /home/mediacms.io/bento4/utils/ && \
    chmod +x /home/mediacms.io/bento4/utils/mp4-hls.py && \
    rm -rf /tmp/bento4

# Set up virtualenv for building Python packages (use same path as runtime)
RUN mkdir -p /home/mediacms.io && \
    python3 -m venv /home/mediacms.io
ENV PATH="/home/mediacms.io/bin:$PATH"

# Copy requirements and install Python packages
COPY requirements.txt requirements-dev.txt ./
ARG DEVELOPMENT_MODE=False
RUN pip install --no-cache uv && \
    uv pip install --no-cache --no-binary lxml --no-binary xmlsec -r requirements.txt && \
    if [ "$DEVELOPMENT_MODE" = "True" ]; then \
        uv pip install --no-cache -r requirements-dev.txt; \
    fi && \
    find /home/mediacms.io -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "*.pyc" -delete 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "*.pyo" -delete 2>/dev/null || true && \
    find /home/mediacms.io -type d -name "tests" ! -path "*/site-packages/*" -exec rm -rf {} + 2>/dev/null || true && \
    find /home/mediacms.io -type d -name "test" ! -path "*/site-packages/*" -exec rm -rf {} + 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "*.txt" -path "*/tests/*" -delete 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "README*" -path "*/site-packages/*" -delete 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "CHANGELOG*" -path "*/site-packages/*" -delete 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "LICENSE*" -path "*/site-packages/*" -delete 2>/dev/null || true

############ BUILD IMAGE FOR WORKER-FULL (Ubuntu-based for PyTorch compatibility) ############
FROM python:3.13-slim AS build-image-full

# Update and install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    libpq-dev \
    libffi-dev \
    pkg-config \
    zlib1g-dev \
    libxml2-dev \
    libxslt1-dev \
    libxmlsec1-dev \
    imagemagick \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Clone Bento4 source to get mp4-hls.py Python script
RUN git clone -b v1.6.0-637 https://github.com/axiomatic-systems/Bento4.git /tmp/bento4 && \
    mkdir -p /home/mediacms.io/bento4/utils && \
    cp -r /tmp/bento4/Source/Python/utils/* /home/mediacms.io/bento4/utils/ && \
    chmod +x /home/mediacms.io/bento4/utils/mp4-hls.py && \
    rm -rf /tmp/bento4

# Set up virtualenv for building Python packages (use same path as runtime)
RUN mkdir -p /home/mediacms.io && \
    python3 -m venv /home/mediacms.io
ENV PATH="/home/mediacms.io/bin:$PATH"

# Copy requirements and install Python packages
COPY requirements.txt requirements-dev.txt ./
ARG DEVELOPMENT_MODE=False
RUN pip install --no-cache-dir uv && \
    uv pip install --no-cache --no-binary lxml --no-binary xmlsec -r requirements.txt && \
    if [ "$DEVELOPMENT_MODE" = "True" ]; then \
        uv pip install --no-cache -r requirements-dev.txt; \
    fi && \
    find /home/mediacms.io -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "*.pyc" -delete 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "*.pyo" -delete 2>/dev/null || true && \
    find /home/mediacms.io -type d -name "tests" ! -path "*/site-packages/*" -exec rm -rf {} + 2>/dev/null || true && \
    find /home/mediacms.io -type d -name "test" ! -path "*/site-packages/*" -exec rm -rf {} + 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "*.txt" -path "*/tests/*" -delete 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "README*" -path "*/site-packages/*" -delete 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "CHANGELOG*" -path "*/site-packages/*" -delete 2>/dev/null || true && \
    find /home/mediacms.io -type f -name "LICENSE*" -path "*/site-packages/*" -delete 2>/dev/null || true

############ BASE RUNTIME IMAGE ############
FROM python:3.13-alpine AS base

LABEL org.opencontainers.image.title="MediaCMS"
LABEL org.opencontainers.image.description="Modern, scalable and open source video platform"

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    CELERY_APP='cms' \
    VIRTUAL_ENV=/home/mediacms.io \
    PATH="/home/mediacms.io/bin:/usr/lib/jellyfin-ffmpeg:/home/mediacms.io/bento4/bin:/usr/local/bin:/usr/bin:$PATH"

# Update installed packages and clean cache
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Install only runtime system dependencies (no build tools)
RUN apk add --no-cache \
    postgresql-libs \
    libxml2 \
    libxslt \
    xmlsec \
    imagemagick \
    imagemagick-libs \
    procps \
    zlib \
    jellyfin-ffmpeg \
    bento4 \
    && rm -rf /var/cache/apk/*

# Set up virtualenv directory structure
RUN mkdir -p /home/mediacms.io/mediacms/logs /home/mediacms.io/mediacms/media_files /home/mediacms.io/mediacms/static

# Copy Python virtualenv from build stage (created at same path, so paths are correct)
COPY --from=build-image /home/mediacms.io/bin /home/mediacms.io/bin
COPY --from=build-image /home/mediacms.io/lib /home/mediacms.io/lib
COPY --from=build-image /home/mediacms.io/include /home/mediacms.io/include
COPY --from=build-image /home/mediacms.io/pyvenv.cfg /home/mediacms.io/pyvenv.cfg

# Copy Bento4 Python utils from build image
COPY --from=build-image /home/mediacms.io/bento4 /home/mediacms.io/bento4

# Create mp4hls wrapper script that calls mp4-hls.py
RUN echo '#!/bin/sh' > /usr/local/bin/mp4hls && \
    echo 'BASEDIR="/home/mediacms.io/bento4"' >> /usr/local/bin/mp4hls && \
    echo 'exec python3 "$BASEDIR/utils/mp4-hls.py" "$@"' >> /usr/local/bin/mp4hls && \
    chmod +x /usr/local/bin/mp4hls
# Note: jellyfin-ffmpeg is installed via apk above, so ffmpeg/ffprobe are available in PATH
# Note: qt-faststart is only available for x86_64 builds (optional utility for MP4 optimization)
# If needed, it can be added separately or handled conditionally via a wrapper script

# Create www-data user first
RUN addgroup -g 33 www-data 2>/dev/null || true && \
    adduser -D -u 33 -G www-data www-data 2>/dev/null || true

# Copy application files (media_files excluded except userlogos via .dockerignore)
COPY --chown=www-data:www-data . /home/mediacms.io/mediacms
WORKDIR /home/mediacms.io/mediacms

# Clean up unnecessary files and Python cache after copy
RUN find /home/mediacms.io/mediacms -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true && \
    find /home/mediacms.io/mediacms -type f -name "*.pyc" -delete 2>/dev/null || true && \
    find /home/mediacms.io/mediacms -type f -name "*.pyo" -delete 2>/dev/null || true && \
    find /home/mediacms.io/mediacms -type f -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true

# Copy stock media files to staging location (for initialization in migrations)
RUN if [ -d "/home/mediacms.io/mediacms/media_files/userlogos" ]; then \
        mkdir -p /home/mediacms.io/stock_media_files && \
        cp -r /home/mediacms.io/mediacms/media_files/userlogos /home/mediacms.io/stock_media_files/ && \
        rm -rf /home/mediacms.io/mediacms/media_files; \
    fi

# Copy imagemagick policy for sprite thumbnail generation
# Alpine uses ImageMagick-7, but we'll copy to both possible locations for compatibility
COPY config/imagemagick/policy.xml /tmp/policy.xml
RUN if [ -d /etc/ImageMagick-7 ]; then \
        cp /tmp/policy.xml /etc/ImageMagick-7/policy.xml; \
    elif [ -d /etc/ImageMagick-6 ]; then \
        cp /tmp/policy.xml /etc/ImageMagick-6/policy.xml; \
    fi && \
    rm /tmp/policy.xml

# Create runtime directories and set permissions
# Note: logs, media_files, and static are volumes, but we ensure directories exist with correct ownership
RUN mkdir -p /var/run/mediacms /var/lib/mediacms /home/mediacms.io/mediacms/logs \
             /home/mediacms.io/mediacms/media_files \
             /home/mediacms.io/mediacms/static && \
    chown -R www-data:www-data /home/mediacms.io/mediacms \
                                /var/run/mediacms \
                                /var/lib/mediacms

############ BASE RUNTIME IMAGE FOR WORKER-FULL (Ubuntu-based) ############
FROM python:3.13-slim AS base-full

LABEL org.opencontainers.image.title="MediaCMS"
LABEL org.opencontainers.image.description="Modern, scalable and open source video platform"

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    CELERY_APP='cms' \
    VIRTUAL_ENV=/home/mediacms.io \
    XDG_CACHE_HOME=/home/mediacms.io/.cache \
    PATH="/home/mediacms.io/bin:/usr/bin/ffmpeg:/home/mediacms.io/bento4/bin:/usr/local/bin:/usr/bin:$PATH"

# Install runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libxml2 \
    libxslt1.1 \
    libxmlsec1 \
    libxmlsec1-openssl \
    imagemagick \
    ffmpeg \
    procps \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

# Set up virtualenv directory structure
RUN mkdir -p /home/mediacms.io/mediacms/logs /home/mediacms.io/mediacms/media_files /home/mediacms.io/mediacms/static

# Copy Python virtualenv from build-image-full
COPY --from=build-image-full /home/mediacms.io/bin /home/mediacms.io/bin
COPY --from=build-image-full /home/mediacms.io/lib /home/mediacms.io/lib
COPY --from=build-image-full /home/mediacms.io/include /home/mediacms.io/include
COPY --from=build-image-full /home/mediacms.io/pyvenv.cfg /home/mediacms.io/pyvenv.cfg

# Copy Bento4 Python utils from build image
COPY --from=build-image-full /home/mediacms.io/bento4 /home/mediacms.io/bento4

# Create mp4hls wrapper script that calls mp4-hls.py
RUN echo '#!/bin/sh' > /usr/local/bin/mp4hls && \
    echo 'BASEDIR="/home/mediacms.io/bento4"' >> /usr/local/bin/mp4hls && \
    echo 'exec python3 "$BASEDIR/utils/mp4-hls.py" "$@"' >> /usr/local/bin/mp4hls && \
    chmod +x /usr/local/bin/mp4hls

# Create www-data user
RUN groupadd -g 33 www-data 2>/dev/null || true && \
    useradd -u 33 -g www-data -m -s /bin/bash www-data 2>/dev/null || true

# Copy application files
COPY --chown=www-data:www-data . /home/mediacms.io/mediacms
WORKDIR /home/mediacms.io/mediacms

# Clean up unnecessary files and Python cache after copy
RUN find /home/mediacms.io/mediacms -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true && \
    find /home/mediacms.io/mediacms -type f -name "*.pyc" -delete 2>/dev/null || true && \
    find /home/mediacms.io/mediacms -type f -name "*.pyo" -delete 2>/dev/null || true && \
    find /home/mediacms.io/mediacms -type f -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true

# Copy stock media files to staging location (for initialization in migrations)
RUN if [ -d "/home/mediacms.io/mediacms/media_files/userlogos" ]; then \
        mkdir -p /home/mediacms.io/stock_media_files && \
        cp -r /home/mediacms.io/mediacms/media_files/userlogos /home/mediacms.io/stock_media_files/ && \
        rm -rf /home/mediacms.io/mediacms/media_files; \
    fi

# Copy imagemagick policy for sprite thumbnail generation
COPY config/imagemagick/policy.xml /tmp/policy.xml
RUN if [ -d /etc/ImageMagick-7 ]; then \
        cp /tmp/policy.xml /etc/ImageMagick-7/policy.xml; \
    elif [ -d /etc/ImageMagick-6 ]; then \
        cp /tmp/policy.xml /etc/ImageMagick-6/policy.xml; \
    fi && \
    rm /tmp/policy.xml

# Create runtime directories and set permissions
RUN mkdir -p /var/run/mediacms /var/lib/mediacms /home/mediacms.io/mediacms/logs \
             /home/mediacms.io/mediacms/media_files \
             /home/mediacms.io/mediacms/static \
             /home/mediacms.io/.cache \
             /var/www && \
    chown -R www-data:www-data /home/mediacms.io/mediacms \
                                /home/mediacms.io/.cache \
                                /var/www \
                                /var/run/mediacms \
                                /var/lib/mediacms

############ API IMAGE (Django/gunicorn) ############
FROM base AS api

# gunicorn is already installed via requirements.txt

# Run container as www-data user
USER www-data

EXPOSE 8000

# Use virtual environment's Python to run gunicorn to ensure correct Python path
WORKDIR /home/mediacms.io/mediacms
CMD ["/home/mediacms.io/bin/gunicorn", "cms.wsgi:application", "--config", "config/gunicorn/gunicorn.conf.py"]

############ WORKER IMAGE (Celery) ############
FROM base AS worker

# Run container as www-data user
USER www-data

# CMD will be overridden in docker-compose for different worker types

############ WORKER-FULL IMAGE (Celery with extra codecs) ############
FROM base-full AS worker-full

USER root

# Copy requirements
COPY requirements-full.txt ./

# Install PyTorch and Whisper (using wheels - no source build needed on glibc)
RUN /home/mediacms.io/bin/python --version && \
    # Install full requirements from requirements-full.txt
    /home/mediacms.io/bin/uv pip install --no-cache -r requirements-full.txt && \
    # Clean up build artifacts from the virtualenv (but be careful not to remove installed packages)
    (find /home/mediacms.io/lib/python*/site-packages -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true) && \
    (find /home/mediacms.io/lib/python*/site-packages -type f -name "*.pyc" -delete 2>/dev/null || true) && \
    (find /home/mediacms.io/lib/python*/site-packages -type f -name "*.pyo" -delete 2>/dev/null || true) && \
    (find /home/mediacms.io/lib/python*/site-packages -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true) && \
    # Fix ownership of virtualenv (since we installed as root)
    (chown -R www-data:www-data /home/mediacms.io/bin /home/mediacms.io/lib /home/mediacms.io/include /home/mediacms.io/pyvenv.cfg 2>/dev/null || true) && \
    # Clean apt cache
    rm -rf /var/lib/apt/lists/* /var/cache/apt/*

ENV WHISPER_MODELS_DIR=/home/mediacms.io/whisper_models
USER www-data
