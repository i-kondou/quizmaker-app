FROM python:3.11
ENV PYTHONUNBUFFERED=1

WORKDIR /app_backend

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    tesseract-ocr \
    tesseract-ocr-jpn

COPY /backend_project/* ./
RUN pip install --no-cache-dir --upgrade -r /app_backend/requirements.txt

CMD ["uvicorn", "backend.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
