# Telegram CRM Bot

A comprehensive CRM system built with FastAPI and React, integrated with Telegram for managing customer relationships.

## Features

- FastAPI backend with PostgreSQL database
- React frontend with modern UI
- Telegram bot integration
- Machine learning capabilities
- Docker containerization
- Secure authentication and authorization

## Prerequisites

- Docker and Docker Compose
- Python 3.8+
- Node.js 16+
- Telegram API credentials

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/telegram-crm-bot.git
cd telegram-crm-bot
```

2. Copy the environment file and configure it:
```bash
cp .env.example .env
```

3. Set up your environment variables in `.env`:
   - Get `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` from https://my.telegram.org/apps
   - Get `TELEGRAM_BOT_TOKEN` from @BotFather on Telegram
   - Generate `SECRET_KEY`: `openssl rand -hex 32`
   - Generate `SESSION_ENCRYPTION_KEY`: Use Python's Fernet.generate_key()
   - Set a secure `POSTGRES_PASSWORD`

4. Start the application:
```bash
docker-compose up --build
```

The services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Project Structure

```
.
├── backend/                # FastAPI application
│   ├── app/               # Application code
│   ├── alembic/           # Database migrations
│   └── requirements.txt   # Python dependencies
├── frontend/              # React application
│   └── src/              # Source code
├── ml_models/            # Machine learning models
├── docker-compose.yml    # Docker composition
└── README.md            # This file
```

## Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- FastAPI
- React
- Telethon
- PostgreSQL 