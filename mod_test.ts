import { test } from "@cross/test";
import { assertEquals, assertThrows } from "@std/assert";

import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as jsonc_parser from "jsonc-parser";
import * as std_toml from "@std/toml";
import * as std_yaml from "@std/yaml";

import { Json, Jsonc, Text, Toml, Yaml } from "./mod.ts";

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
    using json = new Json(filepath, { validator });
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
    using json = new Jsonc(filepath, { validator });
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
    using json = new Jsonc(filepath, { validator });
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
    using json = new Jsonc(filepath, { validator });
    assertEquals(json.data, { hello: "world" });
    json.data = { foo: "bar" };
  }

  const data = readFileSync(filepath, "utf-8");

  const jsonc = jsonc_parser.parse(data);
  assertEquals(jsonc, { foo: "bar" });
});

test("Toml", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.toml");
  {
    using toml = new Toml(filepath);
    toml.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, 'hello = "world"\n');
});

test("Toml with validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.toml");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }
  {
    using toml = new Toml(filepath, { validator });
    toml.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, 'hello = "world"\n');
});

test("Toml with prepared file and without validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.toml");
  const dummyToml = `
[[bin]]
name = "deno"
path = "cli/main.rs"
`;

  writeFileSync(filepath, dummyToml);

  {
    using toml = new Toml(filepath);

    assertEquals(toml.data, { bin: [{ name: "deno", path: "cli/main.rs" }] });
  }

  const data = readFileSync(filepath, "utf-8");
  const tomlData = std_toml.parse(data);
  assertEquals(tomlData, { bin: [{ name: "deno", path: "cli/main.rs" }] });
});

test("Yaml", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.yaml");
  {
    using yaml = new Yaml(filepath);
    yaml.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, "hello: world\n");
});

test("Yaml with validator", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.yaml");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }
  {
    using yaml = new Yaml(filepath, { validator });
    yaml.data = { hello: "world" };
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, "hello: world\n");
});

test("Yaml with prepared file and without validator", () => {
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
    using yaml = new Yaml<{ foo: string; baz: string[] }>(filepath);
    assertEquals(yaml.data, { foo: "bar", baz: ["qux", "quux"] });
    yaml.data?.baz.push("corge");
  }

  const data = readFileSync(filepath, "utf-8");
  const yamlData = std_yaml.parse(data);
  assertEquals(yamlData, { foo: "bar", baz: ["qux", "quux", "corge"] });
});

test("Text with invalid data and allowInvalidData=true", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.txt");
  writeFileSync(filepath, "bad content");

  function validator(data: unknown): data is string {
    return typeof data === "string" && data.includes("good");
  }

  {
    using text = new Text(filepath, { validator, allowInvalidData: true });
    assertEquals(text.data, undefined);
    text.data = "good content";
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, "good content");
});

test("Json with invalid data and allowInvalidData=true", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.json");
  writeFileSync(filepath, '{"bad": "data"}');

  function validator(data: unknown): data is { good: string } {
    return typeof data === "object" && data != null && "good" in data;
  }

  {
    using json = new Json(filepath, { validator, allowInvalidData: true });
    assertEquals(json.data, undefined);
    json.data = { good: "content" };
  }

  const data = readFileSync(filepath, "utf-8");
  const parsed = JSON.parse(data);
  assertEquals(parsed, { good: "content" });
});

test("Jsonc with invalid data and allowInvalidData=true", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.jsonc");
  writeFileSync(filepath, '{"bad": "data"} // comment');

  function validator(data: unknown): data is { good: string } {
    return typeof data === "object" && data != null && "good" in data;
  }

  {
    using jsonc = new Jsonc(filepath, { validator, allowInvalidData: true });
    assertEquals(jsonc.data, undefined);
    jsonc.data = { good: "content" };
  }

  const data = readFileSync(filepath, "utf-8");
  const parsed = jsonc_parser.parse(data);
  assertEquals(parsed, { good: "content" });
});

test("Toml with invalid data and allowInvalidData=true", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.toml");
  writeFileSync(filepath, 'bad = "data"');

  function validator(data: unknown): data is { good: string } {
    return typeof data === "object" && data != null && "good" in data;
  }

  {
    using toml = new Toml(filepath, { validator, allowInvalidData: true });
    assertEquals(toml.data, undefined);
    toml.data = { good: "content" };
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, 'good = "content"\n');
});

test("Yaml with invalid data and allowInvalidData=true", () => {
  const td = prepareTmpdir();
  const filepath = join(td, "file.yaml");
  writeFileSync(filepath, "bad: data");

  function validator(data: unknown): data is { good: string } {
    return typeof data === "object" && data != null && "good" in data;
  }

  {
    using yaml = new Yaml(filepath, { validator, allowInvalidData: true });
    assertEquals(yaml.data, undefined);
    yaml.data = { good: "content" };
  }

  const data = readFileSync(filepath, "utf-8");
  assertEquals(data, "good: content\n");
});
