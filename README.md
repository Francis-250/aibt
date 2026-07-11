# TyphoidWatch Rwanda

AI-assisted typhoid fever surveillance and outbreak prediction platform built from the project SRS.

## Roles

- Administrator: user access, disease data oversight, model governance, reports, settings, and audit logs.
- Health Officer: case reporting and validation, environmental data, predictions, alerts, and reports.
- Government Official: national dashboard, regional predictions, priority alerts, and government reports.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS, Prisma 7, Neon PostgreSQL, and Better Auth.

## Development

```bash
corepack pnpm install
corepack pnpm exec prisma generate
corepack pnpm dev
```

The database connection is read from `DATABASE_URL`. Better Auth also requires `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.

Open [http://localhost:3000](http://localhost:3000) after starting the development server.

## Demo credentials

Run the seed command before using these accounts. Unless `SEED_USER_PASSWORD` is set, all seeded accounts use the password `TyphoidWatch2026!`.

| Role | Email | Password | Dashboard |
| --- | --- | --- | --- |
| Administrator | `admin@typhoidwatch.test` | `TyphoidWatch2026!` | `/admin` |
| Health Officer | `officer@typhoidwatch.test` | `TyphoidWatch2026!` | `/health-officer` |
| Government Official | `official@typhoidwatch.test` | `TyphoidWatch2026!` | `/government-official` |

Change the seed password and demonstration credentials before deploying publicly.

## How the system works

### 1. Authentication and role routing

Better Auth manages email/password authentication, Google sign-in, email verification, password recovery, sessions, and two-factor fields. After login, the system reads the user role and sends the user to the correct dashboard.

- Public registration creates a Health Officer account.
- Government Official and Administrator roles are assigned by an Administrator.
- Server Actions and dashboard layouts verify the session and role again on the server.

### 2. Disease surveillance

A Health Officer opens **Disease Cases**, selects **Report case**, and records the location, patient details, symptoms, onset date, and initial classification. A submitted case remains pending until an authorized Health Officer validates or rejects it. Only validated records are counted when generating outbreak predictions.

### 3. Environmental monitoring

From **Environmental Data**, a Health Officer records district conditions such as temperature, rainfall, humidity, water quality, sanitation coverage, and flooding. The latest observation for the selected district is used as environmental context during prediction.

### 4. Outbreak prediction

A Health Officer selects a province and district from **Predictions**. The system combines:

- validated cases from the latest 30 days;
- validated cases from the preceding 30 days;
- the latest district environmental observation; and
- the currently active model configuration.

The result includes outbreak probability, expected cases, confidence, risk level, and a recommended response. High or critical results automatically create an outbreak alert.

### 5. Alerts and reporting

Health Officers and Government Officials can review and acknowledge outbreak alerts. Government Officials receive a national view of validated cases, regional predictions, high-risk districts, and active alerts. Report records support daily, weekly, monthly, annual, regional, national, prediction, and summary categories.

### 6. Administration and auditing

Administrators manage user roles, disease records, active model versions, reports, system settings, and audit history. Important data and administrative actions create audit records for traceability.

## Main routes

| Area | Routes |
| --- | --- |
| Public and authentication | `/`, `/auth/login`, `/auth/register`, `/auth/forgot-password` |
| Administrator | `/admin`, `/admin/users`, `/admin/cases`, `/admin/models`, `/admin/reports`, `/admin/audit`, `/admin/settings` |
| Health Officer | `/health-officer`, `/health-officer/cases`, `/health-officer/environment`, `/health-officer/predictions`, `/health-officer/alerts`, `/health-officer/reports` |
| Government Official | `/government-official`, `/government-official/predictions`, `/government-official/alerts`, `/government-official/reports` |

## Environment variables

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=TyphoidWatch Rwanda
SEED_USER_PASSWORD=
```

Google variables are required for social login. Brevo variables are required for verification and password-recovery email delivery.

## Seed data

```bash
corepack pnpm db:seed
```

Set `SEED_USER_PASSWORD` before seeding outside local development. The seed creates demonstration accounts for all three roles, an active transparent baseline model, sample case/environmental records, a prediction, and an alert.

After changing the Prisma schema, run:

```bash
corepack pnpm exec prisma generate
corepack pnpm exec prisma db push
```

## Prediction safety

The included scoring engine is an explainable development baseline, not a clinically validated machine-learning artifact. Its outputs must be reviewed by qualified public-health professionals. Replace it with a validated trained model before production decision-making.
