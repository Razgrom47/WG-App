# Development stage
FROM python:3.12-slim AS development

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7700

ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=7700
ENV FLASK_ENV=development

CMD ["flask", "run"]

# Production stage
FROM python:3.12-slim AS production

WORKDIR /app

RUN adduser --disabled-password --gecos '' appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 7700

ENV FLASK_APP=app.py

# Use gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:7700", "app:create_app()"]
