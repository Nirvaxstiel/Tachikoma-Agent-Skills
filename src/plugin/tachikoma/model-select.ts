#!/usr/bin/env bun
import { detectAndSelect } from "../model-harness";

const request = Bun.argv.slice(2).join(" ");
const result = await detectAndSelect(request || undefined);
console.log(JSON.stringify(result, null, 2));
