FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=UTF-8 \
    CURL_CA_BUNDLE="" \
    REQUESTS_CA_BUNDLE=""

WORKDIR /app

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Install lightweight CPU version of PyTorch using extra-index-url
RUN pip install --no-cache-dir torch --extra-index-url https://download.pytorch.org/whl/cpu

# Install remaining requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose port for FastAPI chatbot service
EXPOSE 8001

# Run FastAPI with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
