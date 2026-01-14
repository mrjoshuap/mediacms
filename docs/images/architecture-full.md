# Full Deployment Architecture (with Whisper)

```mermaid
flowchart TD
    Clients["Clients"]
    
    Nginx["nginx reverse proxy<br/>(SSL termination,<br/>letsencrypt client)"]
    
    API["api (mediacms_web)<br/>(Django/Gunicorn, port 8000)<br/>(1 or many instances)"]
    
    CeleryBeat["celery_beat<br/>(singleton)"]
    Redis["redis<br/>(singleton)"]
    
    Migrations["migrations<br/>(run-once)"]
    CeleryWorker["celery_worker<br/>[celery_short, celery_long (full)]<br/>celery_long: worker-full<br/>(Whisper transcription)<br/>(1 or many instances)"]
    
    Postgres["postgres database<br/>(singleton instance)"]
    
    FileStore["File store<br/>(static_files, media_files,<br/>logs, celerybeat_data,<br/>postgres_data,<br/>whisper_models)"]
    
    Clients --> Nginx
    Nginx --> API
    API --> CeleryBeat
    API --> Redis
    CeleryBeat --> Redis
    CeleryBeat --> Migrations
    Redis --> CeleryWorker
    Migrations --> Postgres
    CeleryWorker --> Postgres
    API --> FileStore
    Redis --> FileStore
    CeleryWorker --> FileStore
    Postgres --> FileStore
```
