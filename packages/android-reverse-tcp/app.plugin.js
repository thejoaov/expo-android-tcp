import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const plugin = require("./dist/index.cjs");

export default plugin.default ?? plugin;
