# Migrate from Supabase to DigitalOcean PostgreSQL

## 1. Create the DigitalOcean database

1. Go to DigitalOcean → **Databases** → **Create Database**
2. Choose **PostgreSQL** (pick the same major version as your Supabase DB)
3. Pick region, plan, then create

---

## 2. Get your Supabase connection string

In Supabase dashboard → **Settings** → **Database** → copy the **URI** (use the "Session mode" one, port `5432`):

```
postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

---

## 3. Dump the database

```bash
pg_dump \
  --no-owner \
  --no-acl \
  -Fc \
  "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" \
  -f backup.dump
```

`-Fc` = custom format (compressed, best for restoring). `--no-owner` and `--no-acl` strip Supabase-specific roles that won't exist on DigitalOcean.

---

## 4. Get your DigitalOcean connection string

In DO dashboard → your database → **Connection Details** → copy the URI:

```
postgresql://doadmin:[password]@db.[cluster].db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

---

## 5. Restore to DigitalOcean

```bash
pg_restore \
  --no-owner \
  --no-acl \
  -d "postgresql://doadmin:[password]@db.[cluster].db.ondigitalocean.com:25060/defaultdb?sslmode=require" \
  backup.dump
```

---

## 6. Verify

```bash
psql "postgresql://doadmin:[password]@..." \
  -c "\dt"   # list tables
```

Spot-check a few row counts match.

---

## 7. Update your app config

Swap the `DATABASE_URL` environment variable in your app (and on whatever host it runs on) to the new DigitalOcean URI.

---

## 8. Test then cut over

1. Point a staging/test env at the new DB first
2. Run your app, check everything works
3. Update production env var
4. Keep the Supabase project alive (don't delete) for a week as a fallback
