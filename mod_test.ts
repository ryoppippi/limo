import { test } from "@cross/test";
import { assertEquals, assertThrows } from "@std/assert";

import * as std_yaml from "@std/yaml";
import { createFixture } from "fs-fixture";

import {
  createLimoCustom,
  createLimoJson,
  createLimoText,
  createLimoToml,
  createLimoYaml,
  type CustomFormat,
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

test("createLimoCustom - CSV format", async () => {
  await using fixture = await createFixture({});
  const filepath = fixture.getPath("data.csv");

  const csvFormat: CustomFormat<string[]> = {
    parse: (text: string): string[] => text.split(",").map((s) => s.trim()),
    stringify: (data: string[]): string => data.join(", "),
  };

  {
    using csv = createLimoCustom(filepath, csvFormat);
    csv.data = ["apple", "banana", "cherry"];
  }

  const data = await fixture.readFile("data.csv", "utf-8");
  assertEquals(data, "apple, banana, cherry");
});

test("createLimoCustom - Key-value format with validator", async () => {
  await using fixture = await createFixture({});
  const filepath = fixture.getPath("config.conf");

  interface Config {
    name: string;
    version: number;
  }

  function validator(data: unknown): data is Config {
    return typeof data === "object" && data != null &&
      "name" in data && "version" in data &&
      typeof (data as Record<string, unknown>).name === "string" &&
      typeof (data as Record<string, unknown>).version === "number";
  }

  const configFormat: CustomFormat<Config> = {
    parse: (text: string): Config => {
      const lines = text.split("\n").filter((line) => line.trim());
      const config = {} as Record<string, string | number>;
      lines.forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          const trimmedKey = key.trim();
          const trimmedValue = value.trim();
          config[trimmedKey] = isNaN(Number(trimmedValue))
            ? trimmedValue
            : Number(trimmedValue);
        }
      });
      return config as unknown as Config;
    },
    stringify: (data: Config): string =>
      Object.entries(data).map(([k, v]) => `${k}=${v}`).join("\n"),
  };

  {
    using config = createLimoCustom(filepath, configFormat, { validator });
    config.data = { name: "myapp", version: 2 };
  }

  const data = await fixture.readFile("config.conf", "utf-8");
  assertEquals(data, "name=myapp\nversion=2");
});


test("createLimoCustom - With prepared file", async () => {
  await using fixture = await createFixture({
    "data.csv": "red,green,blue",
  });
  const filepath = fixture.getPath("data.csv");

  const csvFormat: CustomFormat<string[]> = {
    parse: (text: string): string[] => text.split(",").map((s) => s.trim()),
    stringify: (data: string[]): string => data.join(", "),
  };

  {
    using csv = createLimoCustom(filepath, csvFormat);
    assertEquals(csv.data, ["red", "green", "blue"]);
    csv.data?.push("yellow");
  }

  const data = await fixture.readFile("data.csv", "utf-8");
  assertEquals(data, "red, green, blue, yellow");
});

test("createLimoCustom - With validator failure and allowValidatorFailure: true", async () => {
  await using fixture = await createFixture({
    "config.conf": "invalid=data\nmissing=version",
  });
  const filepath = fixture.getPath("config.conf");

  interface Config {
    name: string;
    version: number;
  }

  function validator(data: unknown): data is Config {
    return typeof data === "object" && data != null &&
      "name" in data && "version" in data &&
      typeof (data as Record<string, unknown>).name === "string" &&
      typeof (data as Record<string, unknown>).version === "number";
  }

  const configFormat: CustomFormat<Config> = {
    parse: (text: string): Config => {
      const lines = text.split("\n").filter((line) => line.trim());
      const config = {} as Record<string, string | number>;
      lines.forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          const trimmedKey = key.trim();
          const trimmedValue = value.trim();
          config[trimmedKey] = isNaN(Number(trimmedValue))
            ? trimmedValue
            : Number(trimmedValue);
        }
      });
      return config as unknown as Config;
    },
    stringify: (data: Config): string =>
      Object.entries(data).map(([k, v]) => `${k}=${v}`).join("\n"),
  };

  {
    using config = createLimoCustom(filepath, configFormat, {
      validator,
      allowValidatorFailure: true,
    });
    assertEquals(config.data, undefined);
  }
});

test("createLimoCustom - With validator failure and allowValidatorFailure: false", async () => {
  await using fixture = await createFixture({
    "config.conf": "invalid=data\nmissing=version",
  });
  const filepath = fixture.getPath("config.conf");

  interface Config {
    name: string;
    version: number;
  }

  function validator(data: unknown): data is Config {
    return typeof data === "object" && data != null &&
      "name" in data && "version" in data &&
      typeof (data as Record<string, unknown>).name === "string" &&
      typeof (data as Record<string, unknown>).version === "number";
  }

  const configFormat: CustomFormat<Config> = {
    parse: (text: string): Config => {
      const lines = text.split("\n").filter((line) => line.trim());
      const config = {} as Record<string, string | number>;
      lines.forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          const trimmedKey = key.trim();
          const trimmedValue = value.trim();
          config[trimmedKey] = isNaN(Number(trimmedValue))
            ? trimmedValue
            : Number(trimmedValue);
        }
      });
      return config as unknown as Config;
    },
    stringify: (data: Config): string =>
      Object.entries(data).map(([k, v]) => `${k}=${v}`).join("\n"),
  };

  assertThrows(() => {
    using _config = createLimoCustom(filepath, configFormat, {
      validator,
      allowValidatorFailure: false,
    });
  });
});

test("createLimoCustom - Custom JSON-like format", async () => {
  await using fixture = await createFixture({});
  const filepath = fixture.getPath("custom.dat");

  interface Person {
    name: string;
    age: number;
  }

  const customFormat: CustomFormat<Person> = {
    parse: (text: string): Person => {
      const match = text.match(/Person\{name:([^,]+),age:(\d+)\}/);
      if (!match) throw new Error("Invalid format");
      return { name: match[1], age: parseInt(match[2]) };
    },
    stringify: (data: Person): string =>
      `Person{name:${data.name},age:${data.age}}`,
  };

  {
    using person = createLimoCustom(filepath, customFormat);
    person.data = { name: "Alice", age: 30 };
  }

  const data = await fixture.readFile("custom.dat", "utf-8");
  assertEquals(data, "Person{name:Alice,age:30}");
});
