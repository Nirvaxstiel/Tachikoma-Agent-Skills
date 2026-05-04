#!/usr/bin/env bun
import { loadProjectContext } from "../context-manager";

const cwd = Bun.argv[2] || process.cwd();
const context = await loadProjectContext(cwd);
console.log(JSON.stringify(context, null, 2));
