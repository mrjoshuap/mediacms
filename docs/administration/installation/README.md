# Installation Guide

Choose your installation method based on your needs and infrastructure.

## Installation Methods

MediaCMS supports two main installation methods:

1. **[Docker Standard Installation](docker-standard.md)** (Recommended)
   - Easy to deploy and maintain
   - Production-ready
   - Best for most users

2. **[Docker Full Installation](docker-full.md)**
   - Includes Whisper transcription support
   - Additional codecs
   - Higher resource requirements

3. **[Single Server Installation](single-server.md)**
   - Traditional Linux installation
   - Full control over services
   - Requires more setup

## Architecture

Understanding the deployment architecture helps with planning and troubleshooting:

- [Deployment Architectures](architecture.md) - Architecture diagrams and explanations

## Choosing Your Method

### Use Docker if:
- You want quick deployment
- You prefer containerized applications
- You need easy updates
- You're deploying to cloud platforms

### Use Single Server if:
- You need fine-grained control
- You're deploying on bare metal
- You have specific service requirements
- You prefer traditional Linux services

## Prerequisites

### Docker Installation
- Docker and Docker Compose installed
- 4GB RAM minimum (8GB+ recommended)
- 2-4 CPUs minimum
- Sufficient disk space (plan for 3x expected media storage)

### Single Server Installation
- Ubuntu 22.04 or 24.04 (recommended)
- Root or sudo access
- 4GB RAM minimum
- 2-4 CPUs minimum
- Sufficient disk space

## Next Steps

After installation:
1. [Configuration Guide](../configuration/README.md) - Configure your installation
2. [Maintenance Guide](../maintenance/README.md) - Learn about updates and backups
