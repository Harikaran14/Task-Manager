Link: https://task-manager-ogvp.onrender.com/

## Features

### Authentication

- `POST /register`
- `POST /login`
- Password hashing with bcrypt
- JWT-based protected routes

### Tasks

- `POST /tasks`
- `GET /tasks`
- `GET /tasks/{id}`
- `PUT /tasks/{id}`
- `DELETE /tasks/{id}`

Users can only access their own tasks.

### Extras Included

- Pagination with `page` and `page_size`
- Filtering with `?completed=true` or `?completed=false`
- Responsive frontend
- `/docs` available from FastAPI Swagger UI
- `.env.example` included
- Dockerfile included

## Environment Variables

Create a `.env` file in the project root using `.env.example`.

```env
APP_NAME=FastAPI Task Manager
SECRET_KEY=change-this-to-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=sqlite:///./backend/task_manager.db
CORS_ORIGINS=*
```

## How to Run Locally

1. Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file from `.env.example`.

4. Start the app:

```bash
uvicorn backend.app.main:app --reload
```

5. Open:

- Frontend: `http://127.0.0.1:8000/`
- Swagger docs: `http://127.0.0.1:8000/docs`

## Running Tests

```bash
pytest
```

## Docker

Build and run with:

```bash
docker build -t fastapi-task-manager .
docker run -p 8000:8000 --env-file .env fastapi-task-manager
```

## Deployment Notes

- Public GitHub repository link: add your repo URL after pushing this project
- Live deployment link: add your Render, Railway, or similar deployed URL after deployment
- Recommended start command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`

## API Examples

### Register

```bash
curl -X POST http://127.0.0.1:8000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Hari","email":"hari@example.com","password":"strongpass"}'
```

### Login

```bash
curl -X POST http://127.0.0.1:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hari@example.com","password":"strongpass"}'
```

### Create Task

```bash
curl -X POST http://127.0.0.1:8000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Build app","description":"Finish the intern task"}'
```
