const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const ruPath = path.join(root, "messages", "ru", "app.json");
const kkPath = path.join(root, "messages", "kk", "app.json");

function merge(basePath, patchPaths) {
  const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
  for (const patchPath of patchPaths) {
    const patch = JSON.parse(fs.readFileSync(patchPath, "utf8"));
    for (const k of Object.keys(patch)) {
      if (Object.prototype.hasOwnProperty.call(base, k)) {
        throw new Error(`Key ${k} already exists in ${basePath}`);
      }
      base[k] = patch[k];
    }
    fs.unlinkSync(patchPath);
  }
  fs.writeFileSync(basePath, JSON.stringify(base, null, 2) + "\n");
}

const ruPatches = [
  path.join(root, "messages", "_super_admin_ru_1.json"),
  path.join(root, "messages", "_super_admin_ru_2.json"),
].filter((p) => fs.existsSync(p));
const kkPatches = [
  path.join(root, "messages", "_super_admin_kk_1.json"),
  path.join(root, "messages", "_super_admin_kk_2.json"),
].filter((p) => fs.existsSync(p));

if (ruPatches.length === 0 || kkPatches.length === 0) {
  console.error("Missing patch files");
  process.exit(1);
}
merge(ruPath, ruPatches);
merge(kkPath, kkPatches);
console.log("Merged super-admin locales into ru/kk app.json");
