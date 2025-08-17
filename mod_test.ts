import { expect, test } from "bun:test";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as toml from "@iarna/toml";
import * as yaml from "js-yaml";
import * as jsonc_parser from "jsonc-parser";

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
	expect(data).toBe("Hello, World!");
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
	expect(json).toEqual({ hello: "world" });
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
	expect(json).toEqual({ hello: "world" });
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

	expect(jsonc).toEqual({ hello: "world" });
});

test("Jsonc with prepared file and without validator", () => {
	const td = prepareTmpdir();
	const filepath = join(td, "file.jsonc");
	const dummyJsonc = '{"foo": "bar", } // comment';
	writeFileSync(filepath, dummyJsonc);

	{
		using json = new Jsonc(filepath);

		expect(json.data).toEqual({ foo: "bar" });
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
	expect(jsonc).toEqual({ hello: "world" });
});

test("Jsonc with invalid data and validator", () => {
	const td = prepareTmpdir();
	const filepath = join(td, "file.jsonc");

	function validator(data: unknown): data is { hello: string } {
		return typeof data === "object" && data != null && "hello" in data;
	}

	writeFileSync(filepath, '{"foo": "bar"}');

	expect(() => {
		using json = new Jsonc(filepath, { validator });
		expect(json.data).toEqual({ hello: "world" });
	}).toThrow();
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
		expect(json.data).toEqual({ hello: "world" });
		json.data = { foo: "bar" };
	}

	const data = readFileSync(filepath, "utf-8");

	const jsonc = jsonc_parser.parse(data);
	expect(jsonc).toEqual({ foo: "bar" });
});

test("Toml", () => {
	const td = prepareTmpdir();
	const filepath = join(td, "file.toml");
	{
		using toml = new Toml(filepath);
		toml.data = { hello: "world" };
	}

	const data = readFileSync(filepath, "utf-8");
	expect(data).toBe('hello = "world"\n');
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
	expect(data).toBe('hello = "world"\n');
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

		expect(toml.data).toEqual({ bin: [{ name: "deno", path: "cli/main.rs" }] });
	}

	const data = readFileSync(filepath, "utf-8");
	const tomlData = toml.parse(data);
	expect(tomlData).toEqual({ bin: [{ name: "deno", path: "cli/main.rs" }] });
});

test("Yaml", () => {
	const td = prepareTmpdir();
	const filepath = join(td, "file.yaml");
	{
		using yaml = new Yaml(filepath);
		yaml.data = { hello: "world" };
	}

	const data = readFileSync(filepath, "utf-8");
	expect(data).toBe("hello: world\n");
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
	expect(data).toBe("hello: world\n");
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
		expect(yaml.data).toEqual({ foo: "bar", baz: ["qux", "quux"] });
		yaml.data?.baz.push("corge");
	}

	const data = readFileSync(filepath, "utf-8");
	const yamlData = yaml.load(data);
	expect(yamlData).toEqual({ foo: "bar", baz: ["qux", "quux", "corge"] });
});
