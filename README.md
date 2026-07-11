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

## Seed data

```bash
corepack pnpm db:seed
```

Set `SEED_USER_PASSWORD` before seeding outside local development. The seed creates demonstration accounts for all three roles, an active transparent baseline model, sample case/environmental records, a prediction, and an alert.

## Prediction safety

The included scoring engine is an explainable development baseline, not a clinically validated machine-learning artifact. Its outputs must be reviewed by qualified public-health professionals. Replace it with a validated trained model before production decision-making.
