# Oncology EHR Docker Starter

Now moved from demo shell to a DB-backed dynamic app foundation.

## Services

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api
- Swagger: http://localhost:4000/api/docs
- PostgreSQL: localhost:5435

## Dedicated database

This project now uses its own isolated PostgreSQL database and volume:

- host: localhost
- port: 5435
- database: onco_ehr_prod
- user: postgres
- password: password

Inside Docker, the backend connects to:

- host: db
- port: 5432
- database: onco_ehr_prod

## Seeded accounts

- superadmin / superadmin123
- hospital / hospital123
- patient / patient123

## What is dynamic now

- auth/login with JWT
- isolated Postgres-backed data for this project
- seeded users, patients, oncology records, treatments, meds, follow-ups, symptom alerts, and payer submissions
- live overview payloads for superadmin, hospital, and patient tabs
- frontend shell consuming live metrics/tables from backend APIs where data exists

## Run

```bash
docker compose up --build -d
```

## Notes toward production

Already improved:
- dedicated database instead of reusing an old shared one
- separate persistent Docker volume for this app
- real seeded domain data for dynamic rendering
- backend/frontend compile cleanly

Still recommended before real production use:
- replace `synchronize=true` with TypeORM migrations
- rotate JWT secret and move secrets to environment/secret manager
- add RBAC guards per endpoint, not just per screen
- add audit-log persistence instead of derived demo audit rows
- add validation/error states for all CRUD workflows
- put Postgres behind backups + monitoring
