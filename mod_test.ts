import { test } from "@cross/test";
import { assertEquals, assertThrows } from "@std/assert";

import * as jsonc_parser from "jsonc-parser";
import * as std_yaml from "@std/yaml";
import { createFixture } from "fs-fixture";

import {
  createLimoJson,
  createLimoJsonc,
  createLimoText,
  createLimoToml,
  createLimoYaml,
} from "./mod.ts";

test("createLimoText", async () => {
  await using fixture = await createFixture({});
  const filepath = fixture.getPath("file.txt");
  {
    using text = createLimoText(filepath);
    text.data = "Hello, World!";
  }

  const data = await fixture.readFile("file.txt", "utf-8");
  assertEquals(data, "Hello, World!");
});

test("createLimoJson without validator", async () => {
  await using fixture = await createFixture({});
  const filepath = fixture.getPath("file.json");
  {
    using json = createLimoJson(filepath);
    json.data = { hello: "world" };
  }

  const data = await fixture.readFile("file.json", "utf-8");
  const json = JSON.parse(data);
  assertEquals(json, { hello: "world" });
});

test("createLimoJson with validator", async () => {
  await using fixture = await createFixture({});
  const filepath = fixture.getPath("file.json");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }
  {
    using json = createLimoJson(filepath, { validator });
    json.data = { hello: "world" };
  }

  const data = await fixture.readFile("file.json", "utf-8");
  const json = JSON.parse(data);
  assertEquals(json, { hello: "world" });
});

test("createLimoJsonc without validator", async () => {
  await using fixture = await createFixture({});
  const filepath = fixture.getPath("file.jsonc");
  {
    using json = createLimoJsonc(filepath);
    json.data = { hello: "world" };
  }

  const data = await fixture.readFile("file.jsonc", "utf-8");
  const jsonc = jsonc_parser.parse(data);
  assertEquals(jsonc, { hello: "world" });
});

test("createLimoJsonc with prepared file and format preservation", async () => {
  await using fixture = await createFixture({
    "file.jsonc": '{"hello": "world"} // comment',
  });
  const filepath = fixture.getPath("file.jsonc");

  function validator(data: unknown): data is { hello?: string; foo?: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }

  {
    using json = createLimoJsonc(filepath, { validator });
    assertEquals(json.data, { hello: "world" });
    json.data = { foo: "bar" };
  }

  const data = await fixture.readFile("file.jsonc", "utf-8");
  const jsonc = jsonc_parser.parse(data);
  assertEquals(jsonc, { foo: "bar" });
});

test("createLimoToml", async () => {
  await using fixture = await createFixture({});
  const filepath = fixture.getPath("file.toml");
  {
    using toml = createLimoToml(filepath);
    toml.data = { hello: "world" };
  }

  const data = await fixture.readFile("file.toml", "utf-8");
  assertEquals(data, 'hello = "world"\n');
});

test("createLimoToml with validator", async () => {
  await using fixture = await createFixture({});
  const filepath = fixture.getPath("file.toml");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }
  {
    using toml = createLimoToml(filepath, { validator });
    toml.data = { hello: "world" };
  }

  const data = await fixture.readFile("file.toml", "utf-8");
  assertEquals(data, 'hello = "world"\n');
});

test("createLimoYaml", async () => {
  await using fixture = await createFixture({});
  const filepath = fixture.getPath("file.yaml");
  {
    using yaml = createLimoYaml(filepath);
    yaml.data = { hello: "world" };
  }

  const data = await fixture.readFile("file.yaml", "utf-8");
  assertEquals(data, "hello: world\n");
});

test("createLimoYaml with validator", async () => {
  await using fixture = await createFixture({});
  const filepath = fixture.getPath("file.yaml");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }
  {
    using yaml = createLimoYaml(filepath, { validator });
    yaml.data = { hello: "world" };
  }

  const data = await fixture.readFile("file.yaml", "utf-8");
  assertEquals(data, "hello: world\n");
});

test("createLimoYaml with prepared file and without validator", async () => {
  await using fixture = await createFixture({
    "file.yaml": `
foo: bar
baz:
  - qux
  - quux
`,
  });
  const filepath = fixture.getPath("file.yaml");

  {
    using yaml = createLimoYaml<{ foo: string; baz: string[] }>(filepath);
    assertEquals(yaml.data, { foo: "bar", baz: ["qux", "quux"] });
    yaml.data?.baz.push("corge");
  }

  const data = await fixture.readFile("file.yaml", "utf-8");
  const yamlData = std_yaml.parse(data);
  assertEquals(yamlData, { foo: "bar", baz: ["qux", "quux", "corge"] });
});

test("createLimoJson with validator failure and allowValidatorFailure: true", async () => {
  await using fixture = await createFixture({
    "file.json": '{"invalid": "data"}',
  });
  const filepath = fixture.getPath("file.json");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }

  {
    using json = createLimoJson(filepath, {
      validator,
      allowValidatorFailure: true,
    });
    assertEquals(json.data, undefined);
  }
});

test("createLimoJson with validator failure and allowValidatorFailure: false", async () => {
  await using fixture = await createFixture({
    "file.json": '{"invalid": "data"}',
  });
  const filepath = fixture.getPath("file.json");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }

  assertThrows(() => {
    using _json = createLimoJson(filepath, {
      validator,
      allowValidatorFailure: false,
    });
  });
});

test("createLimoJson with validator failure and allowValidatorFailure: undefined (default false)", async () => {
  await using fixture = await createFixture({
    "file.json": '{"invalid": "data"}',
  });
  const filepath = fixture.getPath("file.json");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }

  assertThrows(() => {
    using _json = createLimoJson(filepath, { validator });
  });
});

test("createLimoJsonc with validator failure and allowValidatorFailure: true", async () => {
  await using fixture = await createFixture({
    "file.jsonc": '{"invalid": "data"} // comment',
  });
  const filepath = fixture.getPath("file.jsonc");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }

  {
    using jsonc = createLimoJsonc(filepath, {
      validator,
      allowValidatorFailure: true,
    });
    assertEquals(jsonc.data, undefined);
  }
});

test("createLimoToml with validator failure and allowValidatorFailure: true", async () => {
  await using fixture = await createFixture({
    "file.toml": 'invalid = "data"',
  });
  const filepath = fixture.getPath("file.toml");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }

  {
    using toml = createLimoToml(filepath, {
      validator,
      allowValidatorFailure: true,
    });
    assertEquals(toml.data, undefined);
  }
});

test("createLimoYaml with validator failure and allowValidatorFailure: true", async () => {
  await using fixture = await createFixture({
    "file.yaml": "invalid: data",
  });
  const filepath = fixture.getPath("file.yaml");

  function validator(data: unknown): data is { hello: string } {
    return typeof data === "object" && data != null && "hello" in data;
  }

  {
    using yaml = createLimoYaml(filepath, {
      validator,
      allowValidatorFailure: true,
    });
    assertEquals(yaml.data, undefined);
  }
});

test("createLimoText with validator failure and allowValidatorFailure: true", async () => {
  await using fixture = await createFixture({
    "file.txt": "invalid content",
  });
  const filepath = fixture.getPath("file.txt");

  function validator(data: unknown): data is "hello world" {
    return data === "hello world";
  }

  {
    using text = createLimoText(filepath, {
      validator,
      allowValidatorFailure: true,
    });
    assertEquals(text.data, undefined);
  }
});
