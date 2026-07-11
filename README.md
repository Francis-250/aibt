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

## Complete system flow

```text
User opens TyphoidWatch
        |
        v
Register or sign in with email/password or Google
        |
        v
Better Auth verifies identity and creates a secure session
        |
        v
System reads the assigned role
        |
        +--------------------+------------------------+
        |                    |                        |
        v                    v                        v
  Administrator       Health Officer        Government Official
        |                    |                        |
        |                    v                        |
        |             Submit disease case             |
        |                    |                        |
        |                    v                        |
        |             Validate or reject case          |
        |                    |                        |
        |                    v                        |
        |             Add environmental data           |
        |                    |                        |
        |                    v                        |
        |             Generate district prediction     |
        |                    |                        |
        |                    v                        |
        |          Risk and confidence classification  |
        |                    |                        |
        |          +---------+---------+              |
        |          |                   |              |
        |          v                   v              |
        |     Low/Moderate         High/Critical       |
        |          |                   |              |
        |          v                   v              |
        |     Store result       Create outbreak alert |
        |          |                   |              |
        |          +---------+---------+              |
        |                    |                        |
        |                    v                        v
        |             Health Officer        National/regional review
        |             acknowledges alert    and alert acknowledgement
        |                    |                        |
        +--------------------+------------------------+
                             |
                             v
                    Generate and review reports
                             |
                             v
                 Audit every important system action
```

### Stage 1: Accessing the platform

1. A visitor opens the landing page.
2. The visitor can sign in with email and password or use Google authentication.
3. A new public user can register as a Health Officer.
4. Better Auth sends an email verification code for email registrations.
5. After successful authentication, Better Auth creates a secure database-backed session.
6. The application reads the user role and redirects the user to the correct dashboard.

### Stage 2: Role assignment and access control

The system has three roles:

- **Administrator** manages the platform and assigns roles.
- **Health Officer** collects, validates, and analyzes surveillance information.
- **Government Official** reviews national and regional outbreak intelligence.

Public registration never creates an Administrator or Government Official. An Administrator must assign those roles from the user-management dashboard. Dashboard layouts, Server Actions, and authenticated routes verify permissions on the server before reading or changing data.

### Stage 3: Disease case collection

1. A Health Officer opens **Disease Cases**.
2. The officer selects **Report case**.
3. A popup form collects:
   - province, district, and sector;
   - patient age and sex;
   - symptoms and symptom-onset date; and
   - suspected, probable, or confirmed classification.
4. The system generates a unique case code such as `TYP-2026-000001`.
5. The case is stored with a `PENDING` validation status.
6. The system records the submitting officer and creation time.
7. An audit entry records the submission.

### Stage 4: Disease case validation

1. An authorized Health Officer reviews pending cases.
2. The officer validates or rejects each record.
3. The system stores the reviewer and validation time.
4. Rejected or still-pending cases are excluded from outbreak calculations.
5. Validated records become part of the trusted surveillance dataset.
6. The validation decision is added to the audit history.

### Stage 5: Environmental data collection

1. A Health Officer opens **Environmental Data**.
2. The officer selects **Add observation**.
3. A popup records the location and observation date.
4. The officer can provide:
   - temperature;
   - rainfall;
   - humidity;
   - water-quality index;
   - sanitation coverage; and
   - whether flooding was observed.
5. The observation is stored for its district.
6. The most recent district observation is used when a prediction is requested.

### Stage 6: Generating an outbreak prediction

1. A Health Officer opens **Predictions**.
2. The officer provides a province and district.
3. The system finds the active prediction model.
4. The system counts validated cases during the most recent 30 days.
5. It separately counts validated cases during the preceding 30 days.
6. It loads the latest environmental observation for the district.
7. The prediction engine evaluates case volume, case growth, rainfall, humidity, water quality, sanitation, and flooding.
8. The system produces:
   - outbreak probability;
   - expected case count;
   - confidence score;
   - `LOW`, `MODERATE`, `HIGH`, or `CRITICAL` risk; and
   - a recommended public-health response.
9. The complete input snapshot and result are saved for traceability.

### Stage 7: Alert generation and response

1. `LOW` and `MODERATE` results are stored without creating a priority alert.
2. `HIGH` and `CRITICAL` predictions automatically create an outbreak alert.
3. The alert identifies the affected province, district, risk level, and recommended response.
4. Health Officers review local alerts and acknowledge that they have seen them.
5. Government Officials review the same priority signals from the national dashboard.
6. Alert acknowledgement records who responded and when.
7. Resolved alerts remain available as alert history.

### Stage 8: Government monitoring

Government Officials use a read-focused dashboard to:

- view national validated-case totals;
- compare regional prediction results;
- identify high-risk and critical districts;
- monitor active outbreak alerts;
- acknowledge alerts requiring government coordination; and
- review national, regional, annual, and summary reports.

Government Officials cannot submit or modify disease and environmental records through their dashboard.

### Stage 9: Reports

The reporting module stores report requests and generated report metadata. Supported report categories include:

- daily;
- weekly;
- monthly;
- annual;
- prediction;
- regional;
- national; and
- summarized reports.

A report can contain a reporting period, geographic filter, generation status, summary, export format, file location, and optional schedule.

### Stage 10: System administration

Administrators can:

- review users and change assigned roles;
- monitor all disease case records;
- register and monitor prediction-model versions;
- review report jobs;
- configure system and AI settings;
- inspect application activity; and
- review the complete audit log.

The active model must exist before a Health Officer can generate a prediction. The seed process creates an active development baseline model automatically.

### Stage 11: Audit and accountability

Important operations create audit records. Each record can include:

- the acting user;
- action name;
- affected entity and entity ID;
- human-readable description;
- additional metadata;
- IP address and user agent when available; and
- creation time.

This provides traceability for case submissions, validation decisions, predictions, role changes, model changes, and system configuration.

### Stage 12: Data flow summary

```text
Health Officer
    -> Disease case data
    -> Case validation
    -> Environmental observation
    -> PostgreSQL / Neon database
    -> Prediction engine
    -> Probability + confidence + risk classification
    -> Recommendation
    -> Alert when risk is high or critical
    -> Health Officer and Government Official dashboards
    -> Reports
    -> Public-health response

Administrator
    -> Users + roles
    -> Model versions
    -> Settings
    -> Reports
    -> Audit monitoring
```

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
