import { test } from "@cross/test";
import { assertEquals } from "@std/assert";

import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync } from "node:fs";

import { Text } from "./mod.ts";

function prepareTmpdir() {
  const randomStr = Math.random().toString(36).substring(7);
  const td = join(tmpdir(), randomStr);
  mkdirSync(td, { recursive: true });
  return td;
}

test("Text", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.txt");
  {
    using text = new Text(filepath);
    text.data = "Hello, World!";
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, "Hello, World!");
});
