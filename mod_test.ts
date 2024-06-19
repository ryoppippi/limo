import { test } from "@cross/test";
import { assertEquals, assertThrows } from "@std/assert";

import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as jsonc_parser from "jsonc-parser";

import { Json, Jsonc, Text } from "./mod.ts";

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

test("Jsonc without validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.jsonc");
  {
    using json = new Jsonc(filepath);
    json.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  const jsonc = jsonc_parser.parse(data);

  assertEquals(jsonc, { hello: "world" });
});

test("Jsonc with prepared file and without validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.jsonc");
  const dummyJsonc = '{"foo": "bar", } // comment';
  writeFileSync(filepath, dummyJsonc);

  {
    using json = new Jsonc(filepath);

    assertEquals(json.data, { foo: "bar" });
  }
});

test("Jsonc with validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.jsonc");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }
  {
    using json = new Jsonc(filepath, validator);
    json.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  const jsonc = jsonc_parser.parse(data);
  assertEquals(jsonc, { hello: "world" });
});

test("Jsonc with invalid data and validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.jsonc");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }

  writeFileSync(filepath, '{"foo": "bar"}');

  assertThrows(() => {
    using json = new Jsonc(filepath, validator);
    assertEquals(json.data, { hello: "world" });
  });
});

test("Jsonc with prepared file and valid data and validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.jsonc");
  const dummyJsonc = '{"hello": "world"} // comment';

  writeFileSync(filepath, dummyJsonc);

  function validator(data: unknown): data is { hello?: string; foo?: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }

  {
    using json = new Jsonc(filepath, validator);
    assertEquals(json.data, { hello: "world" });
    json.data = { foo: "bar" };
  }

  const data = readFileSync(filepath, "utf-8");

  const jsonc = jsonc_parser.parse(data);
  assertEquals(jsonc, { foo: "bar" });
});
