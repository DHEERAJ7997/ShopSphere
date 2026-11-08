FROM python:3.11-slim
WORKDIR /app
COPY . /app

# Install dependencies if you provide a requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

EXPOSE 8000
# gateway.py lives in the `venv` subfolder in this repo, so reference it directly
CMD ["uvicorn", "venv.gateway:app", "--host", "0.0.0.0", "--port", "8000"]