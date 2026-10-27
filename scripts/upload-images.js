// One-off: uploads public/assets/images/* to a public Supabase Storage bucket.
// Needs SUPABASE_SECRET_KEY in .env (no VITE_ prefix, so it never reaches the browser).
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

try {
  process.loadEnvFile(path.join(__dirname, "..", ".env"));
} catch (e) {
  // No .env file: rely on variables already set.
}

const url = process.env.VITE_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in .env first.");
  process.exit(1);
}

const BUCKET = "images";
const dir = process.argv[2] || path.join(__dirname, "..", "public", "assets", "images");
const types = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml" };

(async () => {
  const supabase = createClient(url, secret, { auth: { persistSession: false } });

  const created = await supabase.storage.createBucket(BUCKET, { public: true });
  if (created.error && !/already exists/i.test(created.error.message)) {
    console.error("Could not create bucket:", created.error.message);
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => types[path.extname(f).toLowerCase()]);
  let failed = 0;
  for (const file of files) {
    const { error } = await supabase.storage.from(BUCKET).upload(file, fs.readFileSync(path.join(dir, file)), {
      contentType: types[path.extname(file).toLowerCase()],
      cacheControl: "31536000",
      upsert: true,
    });
    if (error) {
      failed++;
      console.error("FAILED " + file + ": " + error.message);
    } else {
      console.log("ok " + file);
    }
  }
  console.log("\nUploaded " + (files.length - failed) + " of " + files.length + " files to bucket '" + BUCKET + "'.");
  if (failed) process.exit(1);
})();
