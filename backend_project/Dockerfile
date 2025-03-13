FROM python:3.11
ENV PYTHONUNBUFFERED=1

WORKDIR /app_backend

COPY /backend_project/* ./
RUN pip install --no-cache-dir --upgrade -r /app_backend/requirements.txt && \
    pip install -qU google-genai langchain-google-genai

CMD ["uvicorn", "backend.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
