1. run pip install -r requirement.txt

Install redis 
1. sudo apt update
2. sudo apt install -y redis-server
2. redis-server --daemonize yes to start redis server
    -You can test with redis-cli ping

    

    ┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATION LAYER                          │
│                    (Apache Airflow / Prefect)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  Data Ingestion │  │  ML/Analytics   │  │   User Interface│
│     Agents      │  │     Engine      │  │      Layer      │
└───────┬────────┘  └────────┬────────┘  └────────┬────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Vector Database  │
                    │   (Pinecone/Weaviate)│
                    └───────────────────┘