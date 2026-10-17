# MongoDB Backup & Disaster Recovery Strategy

This document outlines the backup, restoration, and disaster recovery procedures for the KIIT Electrical Society (KES) website backend.

> [!NOTE]
> Backups are not automatically enabled by default in local development. For production deployments on MongoDB Atlas, automated continuous backups or daily snapshots must be configured in the Atlas console. For self-hosted instances, automated cron jobs using `mongodump` should be deployed as detailed below.

---

## 1. What Needs to be Backed Up

The KES database contains both authoritative user data and stateful operational jobs:

| Collection | Importance | Sensitivity | Description |
|---|---|---|---|
| `join_applications` | **Critical** | High (Applicant PII) | All submitted student applications, domain preferences, contact details, evaluation history, and interview notes. |
| `recruitment_cycles` | **Critical** | Low | Active and historical recruitment cycle definitions, window open/close dates. |
| `admin_accounts` | **Critical** | High (Password Hashes) | Administrator and reviewer accounts with Argon2id password hashes and role assignments. |
| `audit_logs` | **High** | Medium | Immutable history of administrative changes, status updates, reviews, and CSV exports. |
| `cms_content` | **High** | Low (Public Content) | Custom CMS records for projects, achievements, events, faculty, domains, and leadership. |
| `system_settings` | **Medium** | Medium | Approved community and domain-group invitation links. |
| `notification_jobs` | **Medium** | Low | Durable email dispatch queue with status, attempt counter, and error history. |
| `join_challenges` | **Low** | High (HMAC Hashes) | Short-lived OTP challenge records (automatic TTL expiration). Not critical to retain across long-term backups. |
| `admin_sessions` | **Low** | High (Session IDs) | Active administrator sessions (ephemeral). Invalidation during major recovery is standard practice. |

---

## 2. Backup Strategy

### Continuous / Point-in-Time Backups (Atlas Production)
If hosted on MongoDB Atlas:
- Enable **Continuous Cloud Backups** (PITR) with a 7-day retention window.
- Enable daily automated snapshots retained for 30 days.
- Ensure snapshot storage is geographically redundant.

### Scheduled mongodump (Self-Hosted / Managed MongoDB)
For self-hosted MongoDB servers, run daily automated dumps via a secure cron script:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEST="${BACKUP_DIR}/kes_backup_${TIMESTAMP}"

mkdir -p "${DEST}"

# Execute mongodump with gzip compression and oplog for consistency
mongodump --uri="${MONGODB_URI}" \
          --db="${MONGODB_DB:-kes}" \
          --gzip \
          --out="${DEST}"

# Retain local backups for 14 days
find "${BACKUP_DIR}" -maxdepth 1 -type d -name "kes_backup_*" -mtime +14 -exec rm -rf {} +
```

---

## 3. Restoration Procedure

### Complete Database Restoration
To restore the entire database from a `mongodump` directory:

```bash
mongorestore --uri="${MONGODB_URI}" \
             --db="${MONGODB_DB:-kes}" \
             --drop \
             --gzip \
             /path/to/backup/kes_backup_YYYYMMDD_HHMMSS/kes
```
*(The `--drop` flag clears existing collections before restoring them, ensuring clean state without residual orphan records).*

### Re-establishing Indexes After Restore
Always verify and rebuild indexes after any restore:
```bash
npm run backend:setup
```

---

## 4. Recovering Application Data

If a specific recruitment cycle or set of applications was accidentally modified or deleted:
1. Restore the backup to a temporary staging database:
   ```bash
   mongorestore --uri="${MONGODB_URI}" --db=kes_restore_temp --gzip /path/to/backup/kes
   ```
2. Query and export only the desired applications:
   ```bash
   mongoexport --uri="${MONGODB_URI}" --db=kes_restore_temp --collection=join_applications \
               --query='{"cycleId":"2026-27"}' --out=applications_2026.json
   ```
3. Import the clean records back into the active database using upsert mode:
   ```bash
   mongoimport --uri="${MONGODB_URI}" --db=kes --collection=join_applications \
               --mode=upsert --upsertFields="_id" --file=applications_2026.json
   ```

---

## 5. Recovering CMS Content

1. If the CMS database collection `cms_content` is lost or corrupted:
   - The application automatically falls back to the static content registry in `lib/content.js` and `lib/projects/catalogue.mjs`. The public website will remain fully operational without breaking.
2. To re-seed the MongoDB CMS collection with standard published content:
   ```bash
   npm run content:migrate
   ```
   This is completely idempotent and uses `$setOnInsert` to safely restore default content without duplicating entries.

---

## 6. Handling Notification Jobs After Recovery

When restoring a database from an older snapshot, the `notification_jobs` collection may contain stale or previously processed jobs:

1. **Avoid Duplicate Notification Blasts**:
   Immediately after restoration, check for jobs that were in `"pending"` or `"processing"` state:
   ```javascript
   // Run in mongosh connected to restored database:
   db.notification_jobs.find({ status: { $in: ["pending", "processing"] } });
   ```
2. **Mark Stale Jobs as Cancelled**:
   If the backup is more than a few hours old, pending applicant emails or interview invitations should not be blindly re-dispatched to students:
   ```javascript
   db.notification_jobs.updateMany(
     { status: { $in: ["pending", "processing"] }, createdAt: { $lt: new Date(Date.now() - 3600000 * 4) } },
     { $set: { status: "cancelled", error: "Cancelled following system restoration" } }
   );
   ```
3. **Resume Fresh Queue Processing**:
   Once verified, restart the notification runner:
   ```bash
   npm run jobs:process
   ```
