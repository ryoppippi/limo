import { test } from "@cross/test";
import { assertEquals } from "@std/assert";

import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync } from "node:fs";

import { Json, Text } from "./mod.ts";

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

test("Json without validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.json");
  {
    using json = new Json(filepath);
    json.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  const json = JSON.parse(data);
  assertEquals(json, { hello: "world" });
});

test("Json with validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.json");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }
  {
    using json = new Json(filepath, validator);
    json.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  const json = JSON.parse(data);
  assertEquals(json, { hello: "world" });
});
