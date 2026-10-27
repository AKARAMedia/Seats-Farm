import { defineConfig, loadEnv } from "vite";
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const root = import.meta.dirname;
const skip = new Set(["node_modules", "dist", "public", "src", "scripts", ".git", ".wrangler"]);

// Every index.html in the repo is a page, so new pages need no config change.
function findPages(dir) {
  const pages = [];
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) pages.push(...findPages(full));
    else if (name === "index.html") pages.push(full);
  }
  return pages;
}

// Images live in a public Supabase Storage bucket, not in the repo.
// Rewrites /assets/images/<file> to the bucket URL in the HTML and the built CSS.
function supabaseImages(imagesBase) {
  const from = /\/assets\/images\//g;
  return {
    name: "supabase-images",
    transformIndexHtml: (html) => html.replace(from, imagesBase),
    closeBundle() {
      const css = join(root, "dist", "assets", "css", "style.css");
      try {
        writeFileSync(css, readFileSync(css, "utf8").replace(from, imagesBase));
      } catch (e) {
        // No CSS in dist (e.g. dev server): nothing to rewrite.
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "VITE_");
  if (!env.VITE_SUPABASE_URL) throw new Error("VITE_SUPABASE_URL is not set (see .env.example)");
  const imagesBase = env.VITE_SUPABASE_URL.replace(/\/$/, "") + "/storage/v1/object/public/images/";

  return {
    appType: "mpa",
    plugins: [supabaseImages(imagesBase)],
    build: {
      rollupOptions: {
        input: Object.fromEntries(
          findPages(root).map((file) => {
            const dir = relative(root, file).split(sep).slice(0, -1).join("-");
            return [dir || "index", resolve(file)];
          })
        ),
      },
    },
  };
});
