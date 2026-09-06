FROM python:3.9-slim


WORKDIR /app

# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
