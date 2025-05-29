FROM python:3.10-slim

WORKDIR /app

# Install ODBC drivers for SQL Server
RUN apt-get update && apt-get install -y \
    gnupg \
    curl \
    unixodbc \
    unixodbc-dev

# Add Microsoft repository
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql17

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]