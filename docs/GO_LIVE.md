# HPMS Go-Live & UAT Checklist (Phase 11)

## 1. User Acceptance Testing (UAT) Checklist

### Owner App
- [ ] **Onboarding & KYC**: Verify owner can upload KYC docs (checks magic bytes) and get approved.
- [ ] **Property & Room Management**: Add property, add rooms, add beds, verify capacity validations.
- [ ] **Booking Management**: Accept/Reject bookings, transition booking to tenancy on check-in.
- [ ] **Tenancy Management**: Collect rent (mocked), collect deposits, issue notice, check out student.
- [ ] **Complaints**: View complaints from tenants, mark as resolved.

### Student App
- [ ] **Search & Filtering**: Search properties by city, price range, room type, and facilities.
- [ ] **Booking**: Request a bed in a property.
- [ ] **Tenancy Dashboard**: View active tenancy, upload ID proof, report complaints, give notice.
- [ ] **Payment**: Pay deposit and rent via mocked payment gateway.

### Admin Dashboard
- [ ] **Owner Approval**: Approve/Reject owner KYC documents.
- [ ] **Property Audit**: View properties and their statuses.
- [ ] **User Management**: View users and roles.
- [ ] **Reports**: Generate GMV and occupancy reports.

## 2. Security & RLS Matrix Verification

- [ ] All API endpoints have explicit role-based access control dependencies.
- [ ] Supabase Row Level Security (RLS) is enabled on all tables.
- [ ] No `public` tables have `using (true)` policies for inserts/updates/deletes.
- [ ] Uploaded files are validated using magic bytes (not just extensions) and UUID filenames.
- [ ] Rate limiters are actively protecting search, webhooks, and exports endpoints.
- [ ] API is running behind Security Headers (HSTS, CSP, X-Frame-Options).

## 3. Load & Concurrency Testing

- [ ] Seed script (`scripts/seed_volume.py`) executed to generate 5000 users, 50 properties, and 2000 rooms.
- [ ] Locust load test (`scripts/locustfile.py`) executed with 500 concurrent users to verify API stability.

## 4. Backup and Disaster Recovery (DR) Runbook

### Backup
- Backups are automated via Supabase dashboard (Point-in-Time Recovery recommended).
- Manual backups can be taken using `python backend/scripts/backup_db.py`.
- Ensure `pg_dump` is installed on the machine running the script.

### Restore
- To restore a backup, run `python backend/scripts/restore_db.py <path_to_sql_file>`.
- The restore script uses `psql` to execute the SQL dump.

## 5. Go-Live Final Steps

1. Review environment variables (remove `dummy-token-for-dev`, set strong JWT secrets).
2. Set `PAYMENTS_ENABLED=true` when the payment gateway integrations are finalized.
3. Turn off `debug` mode in FastAPI for production.
4. Scale Uvicorn workers in Docker/Systemd.
