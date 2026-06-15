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
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml and build files
COPY pyproject.toml ./

# Install python dependencies first to cache this layer
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e .

# Copy supervisord config
COPY supervisord.conf /etc/supervisor/supervisord.conf

# Copy application files
COPY app /code/app

# Expose Hugging Face Space default port
EXPOSE 7860

# Run supervisord to manage FastAPI and Celery worker
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]
