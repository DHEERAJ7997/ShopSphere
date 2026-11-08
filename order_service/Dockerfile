FROM python:3.11-slim
WORKDIR /app
COPY . /app

RUN pip install --no-cache-dir --upgrade pip && \
    if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

EXPOSE 5003
# Uses Django's development server by default; replace with gunicorn for production
CMD ["python", "manage.py", "runserver", "0.0.0.0:5003"]