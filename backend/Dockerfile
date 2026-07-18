FROM python:3.11-slim

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system appgroup && adduser --system --group appuser

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Ensure output directory exists and is writable by the non-root user
RUN mkdir -p /app/output && chown -R appuser:appgroup /app/output

# Switch to non-root user
USER appuser

EXPOSE 8000

# Start FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
