#use python 3.11
FROM python:3.11-slim 

#set working directory
WORKDIR /app

#Copy requirements.txt file to working directory
COPY requirements.txt .

#Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

#copy code
COPY . .

#run commands
CMD ["python", "-m", "tests.crawlerTest"]