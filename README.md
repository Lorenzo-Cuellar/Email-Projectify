# Email-Projectify

AI-powered system that transforms unstructured emails into organized, project-based knowledge.

## Overview

Email Projectify is an AI-powered web application that automatically organizes a user’s emails into structured, project-based workflows. Instead of manually sorting through inbox clutter, the system continuously analyzes incoming emails, extracts key information, and intelligently maps them to relevant user-defined projects.

## Current Status

Phases 1 and 2 are now scaffolded as a Next.js application with:

- account creation and login
- a project dashboard
- project create, edit, and delete flows
- a visible `Undefined` bucket for future unmatched email summaries
- Prisma-backed local persistence with SQLite for development
- Gmail OAuth connection
- manual Gmail sync to ingest and persist recent email messages
- a stored inbox view in the dashboard

Phase 3 will add AI summarization and project classification.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env
   ```

3. Add a long random value for `SESSION_SECRET`.

4. To enable Gmail sync, create a Google OAuth web application and set:

   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - authorized redirect URI: `http://localhost:3000/api/gmail/callback`

5. Generate the Prisma client and create the local database:

   ```bash
   npm run db:push
   ```

6. Optional: load demo data:

   ```bash
   npm run db:seed
   ```

7. Start the app:

   ```bash
   npm run dev
   ```

## Demo Account

If you seed the database, use:

- Email: `demo@emailprojectify.dev`
- Password: `demo12345`

## Roadmap

- Phase 1: Accounts and project management
- Phase 2: Gmail OAuth, manual sync, and email persistence
- Phase 3: AI summarization and project matching
- Phase 4: scheduled jobs, retries, and manual reclassification
