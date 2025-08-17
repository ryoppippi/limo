import { test } from "@cross/test";
import { assertEquals } from "@std/assert";

import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as jsonc_parser from "jsonc-parser";
import * as std_yaml from "@std/yaml";

import {
  createLimoJson,
  createLimoJsonc,
  createLimoText,
  createLimoToml,
  createLimoYaml,
} from "./mod.ts";

function prepareTmpdir() {
  const randomStr = Math.random().toString(36).substring(7);
  const td = join(tmpdir(), randomStr);
  mkdirSync(td, { recursive: true });
  return td;
}

test("createLimoText", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.txt");
  {
    using text = createLimoText(filepath);
    text.data = "Hello, World!";
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, "Hello, World!");
});

test("createLimoJson without validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.json");
  {
    using json = createLimoJson(filepath);
    json.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  const json = JSON.parse(data);
  assertEquals(json, { hello: "world" });
});

test("createLimoJson with validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.json");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }
  {
    using json = createLimoJson(filepath, { validator });
    json.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  const json = JSON.parse(data);
  assertEquals(json, { hello: "world" });
});

test("createLimoJsonc without validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.jsonc");
  {
    using json = createLimoJsonc(filepath);
    json.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  const jsonc = jsonc_parser.parse(data);
  assertEquals(jsonc, { hello: "world" });
});

test("createLimoJsonc with prepared file and format preservation", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.jsonc");
  const dummyJsonc = '{"hello": "world"} // comment';

  writeFileSync(filepath, dummyJsonc);

  function validator(data: unknown): data is { hello?: string; foo?: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }

  {
    using json = createLimoJsonc(filepath, { validator });
    assertEquals(json.data, { hello: "world" });
    json.data = { foo: "bar" };
  }

  const data = readFileSync(filepath, "utf-8");
  const jsonc = jsonc_parser.parse(data);
  assertEquals(jsonc, { foo: "bar" });
});

test("createLimoToml", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.toml");
  {
    using toml = createLimoToml(filepath);
    toml.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, 'hello = "world"\n');
});

test("createLimoToml with validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.toml");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }
  {
    using toml = createLimoToml(filepath, { validator });
    toml.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, 'hello = "world"\n');
});

test("createLimoYaml", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.yaml");
  {
    using yaml = createLimoYaml(filepath);
    yaml.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, "hello: world\n");
});

test("createLimoYaml with validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.yaml");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }
  {
    using yaml = createLimoYaml(filepath, { validator });
    yaml.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, "hello: world\n");
});

test("createLimoYaml with prepared file and without validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.yaml");
  const dummyYaml = `
foo: bar
baz:
  - qux
  - quux
`;

  writeFileSync(filepath, dummyYaml);

  {
    using yaml = createLimoYaml<{ foo: string; baz: string[] }>(filepath);
    assertEquals(yaml.data, { foo: "bar", baz: ["qux", "quux"] });
    yaml.data?.baz.push("corge");
  }

  const data = readFileSync(filepath, "utf-8");
  const yamlData = std_yaml.parse(data);
  assertEquals(yamlData, { foo: "bar", baz: ["qux", "quux", "corge"] });
});
