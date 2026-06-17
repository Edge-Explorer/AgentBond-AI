FROM python:3.12-slim

# Prevent python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /code

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    supervisor \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download and install Prometheus
RUN wget https://github.com/prometheus/prometheus/releases/download/v2.51.2/prometheus-2.51.2.linux-amd64.tar.gz && \
    tar -xvf prometheus-2.51.2.linux-amd64.tar.gz && \
    mv prometheus-2.51.2.linux-amd64/prometheus /usr/local/bin/ && \
    mv prometheus-2.51.2.linux-amd64/promtool /usr/local/bin/ && \
    rm -rf prometheus-2.51.2.linux-amd64*

# Copy pyproject.toml and build files
COPY pyproject.toml ./

# Install python dependencies first to cache this layer
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e .

# Copy prometheus configuration file
COPY prometheus.yml /code/prometheus.yml

# Copy supervisord config
COPY supervisord.conf /etc/supervisor/supervisord.conf

# Copy application files
COPY app /code/app

# Expose Hugging Face Space default port
EXPOSE 7860

# Run supervisord to manage FastAPI and Celery worker
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
