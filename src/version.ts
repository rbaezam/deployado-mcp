import { createRequire } from "node:module";

// dist/version.js → ../package.json, which npm always ships with the package.
export const VERSION: string = createRequire(import.meta.url)("../package.json").version;
