## 1. Database & Schema Updates

- [x] 1.1 Add `year` column to `glSnapshots` table in `worker/db/schema.ts` as `year: integer("year")`.
- [x] 1.2 Write a migration query to backfill the `year` column for existing snapshot rows using their associated `gl_rows.ymd` values.
- [x] 1.3 Apply the database schema updates using `npx drizzle-kit push` (or equivalent schema push command).

## 2. Backend Routes Implementation

- [x] 2.1 Update `GET /api/gl-snapshots` in `worker/routes/scoping.ts` to parse the `year` query parameter and filter snapshots in the SQL query.
- [x] 2.2 Update `POST /api/gl-snapshots` in `worker/routes/scoping.ts` to extract `year` from the request payload and write it to the `year` column.
- [x] 2.3 Update `POST /api/migration/finalize` in `worker/routes/migration.ts` to insert the parsed target `year` into the newly created `glSnapshots` row.

## 3. Frontend Integration

- [x] 3.1 Update `uploadSnapMutation` in `src/pages/scoping/hooks/useScopingPage.ts` to pass `year` inside the request body.
- [x] 3.2 Update `uploadMutation` inside the `useGLSnapshots` hook in `src/hooks/use-scoping.ts` to pass `year` inside the request body.
- [x] 3.3 Verify compilation and lint standards by running `npm run type-check`, `npm run lint`, and `npm run build`.
