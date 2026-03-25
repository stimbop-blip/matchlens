## MatchLens Local Status

Date: 2026-03-25

### HTTP checks

- Backend root: `http://localhost:8000/` -> `404` (service reachable, no root route)
- Backend docs: `http://localhost:8000/docs` -> `200`
- Backend OpenAPI: `http://localhost:8000/openapi.json` -> `200`
- Frontend: `http://localhost:5173/` -> `200`

### Docker health

- `postgres`: Up (healthy)
- `backend`: Up
- `frontend`: Up
- `bot`: Up

### Local URLs

- Frontend: `http://localhost:5173/`
- Backend API docs: `http://localhost:8000/docs`
- Backend OpenAPI JSON: `http://localhost:8000/openapi.json`
- Backend API base (frontend env): `http://localhost:8000/api/v1`
