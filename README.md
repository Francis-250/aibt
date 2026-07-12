# TyphoidWatch Rwanda

Typhoid fever surveillance and outbreak-risk platform for Health Officers, Government Officials, and Administrators.

## Technology

- Next.js 16, React 19, TypeScript, Tailwind CSS, and shadcn/ui
- Prisma 7 and Neon PostgreSQL
- Custom HS256 JWT authentication using `jose`
- Password hashing using Node.js `crypto.scrypt`
- SMTP email delivery using Nodemailer
- Recharts prediction visualizations

## Authentication

Authentication is implemented with short, explicit JSON API routes under `app/api/auth`.

- A signed JWT is stored in the `typhoidwatch_session` secure, HTTP-only, same-site cookie.
- Session JWTs contain the user ID, role, token version, issuer, audience, issue time, and expiration.
- Every server session verifies the signature, user existence, role, suspension state, and current token version.
- Passwords use scrypt with a random 16-byte salt and are stored only as `salt:hash` envelopes.
- Password verification uses `crypto.timingSafeEqual`.
- Public registration creates only a `health_officer` account.
- Administrators assign `admin` and `government_official` roles.
- Role changes, suspension changes, and password resets increment `tokenVersion`, invalidating existing JWT sessions.
- Password-reset JWTs are purpose-specific and expire after approximately 20 minutes.
- Forgot-password always returns the same response whether or not the email exists.

### Authentication API routes

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/login` | Verify credentials and set the session cookie |
| `POST /api/auth/register` | Create a Health Officer and set the session cookie |
| `POST /api/auth/logout` | Delete the current session cookie |
| `POST /api/auth/forgot-password` | Send a generic password-reset response and email when applicable |
| `POST /api/auth/reset-password` | Verify the reset JWT, change the password, and invalidate sessions |

Every authentication endpoint returns JSON, including validation failures and unexpected server errors.

## Environment variables

Configure these values in `.env.local` for development and in the deployment environment for production:

```env
DATABASE_URL=

# At least 32 unpredictable characters. Use a different value per environment.
JWT_SECRET=

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=TyphoidWatch Rwanda

# Optional application services
GROQ_API_KEY=

# Optional seed override
SEED_USER_PASSWORD=
```

Use `SMTP_SECURE=true` for implicit TLS connections such as port 465. For STARTTLS configurations such as port 587, normally use `SMTP_SECURE=false`.

Never commit `JWT_SECRET`, SMTP credentials, or `DATABASE_URL`.

## Installation and database migration

```bash
corepack pnpm install
corepack pnpm exec prisma format
corepack pnpm exec prisma validate
corepack pnpm exec prisma generate
corepack pnpm exec prisma db push
corepack pnpm dev
```

After changing environment variables, restart the development server.

### Migration from the previous authentication system

The completed migration followed this safe order:

1. Add `User.passwordHash` and `User.tokenVersion`.
2. Copy compatible credential hashes onto `User`.
3. Verify every stored credential hash was copied.
4. Remove obsolete authentication tables and configuration.
5. Regenerate Prisma Client and apply the final schema.

Existing user and application records were preserved. Accounts that previously existed only through social login have no local password and must use password reset to establish one.

## Seed data and credentials

```bash
corepack pnpm db:seed
```

The seed is idempotent by email and fixed domain IDs. It uses the same scrypt password helper as production authentication and invalidates old sessions when seeded passwords or roles are updated.

Unless `SEED_USER_PASSWORD` is configured, the development password is `TyphoidWatch2026!`.

| Role | Email | Dashboard |
| --- | --- | --- |
| Administrator | `admin@typhoidwatch.test` | `/admin` |
| Health Officer | `officer@typhoidwatch.test` | `/health-officer` |
| Government Official | `official@typhoidwatch.test` | `/government-official` |

Change all demonstration credentials before public deployment.

## System flow

```text
User registers or signs in
        ↓
Server verifies scrypt password
        ↓
HS256 JWT is issued in a secure HTTP-only cookie
        ↓
Role-specific dashboard opens
        ↓
Health Officer submits a case using Rwanda location data
        ↓
Authorized officer validates the case
        ↓
System automatically recalculates province, district, sector, cell, and village risk
        ↓
Environmental observations trigger province, district, and sector recalculation
        ↓
High or critical risk creates an alert
        ↓
Government Official sees predictions and alerts automatically
        ↓
Administrator manages users, roles, models, settings, and audit history
```

## Roles

### Health Officer

- Submit and validate typhoid cases
- Record environmental observations
- Run on-demand geographic predictions
- Review automatic predictions and alerts
- Acknowledge alerts and review reports

### Government Official

- Review national and regional statistics
- Compare province-to-village predictions
- Monitor and acknowledge priority alerts
- Review government reports

### Administrator

- Manage users, roles, and suspensions
- Monitor disease records
- Register and activate model versions
- Configure system settings
- Review reports and audit history

## Prediction behavior

Automatic prediction occurs when a case is validated or environmental data changes. The service combines validated case counts from two consecutive 30-day periods with the closest environmental observation. Results include probability, expected cases, confidence, risk classification, and recommendation.

The included engine is an explainable development baseline, not a clinically validated model. Replace or calibrate it using an approved historical typhoid dataset before production medical use.

## Verification

```bash
corepack pnpm exec prisma format
corepack pnpm exec prisma validate
corepack pnpm exec prisma generate
corepack pnpm exec tsc --noEmit
corepack pnpm exec eslint .
corepack pnpm run build
```
