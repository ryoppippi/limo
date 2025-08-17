import { existsSync, readFileSync, writeFileSync } from "node:fs";
import * as jsonc_parser from "jsonc-parser";
import * as std_toml from "@std/toml";
import * as std_yaml from "@std/yaml";

type Validator<T> = (value: unknown) => value is T;
interface Limo<T> {
  [Symbol.dispose](): void;

  get data(): T | undefined;
  set data(value: T);
}

interface Options<T> {
  validator?: Validator<T>;
  allowNoExist?: boolean;
}

type ResolvedOptions<T> =
  & Required<Omit<Options<T>, "validator">>
  & Pick<Options<T>, "validator">;

function resolveOptions<T>(
  options: Options<T>,
): ResolvedOptions<T> {
  return {
    validator: options.validator,
    allowNoExist: options.allowNoExist ?? true,
  };
}

// Internal interfaces for format-specific parsing
interface ParseOptions<T> {
  parse: (text: string) => T;
  stringify: (data: T) => string;
  preserveFormat?: (oldText: string, oldData: T, newData: T) => string;
}

interface InternalOptions<T> extends Options<T> {
  parseOptions: ParseOptions<T>;
}

// Internal unified class - not exported
class LimoFile<T> implements Limo<T> {
  #data: T | undefined;
  #oldData: T | undefined;
  #path: string;
  #text: string | undefined;
  #options: ResolvedOptions<T>;
  #parseOptions: ParseOptions<T>;

  constructor(
    path: string,
    options: InternalOptions<T>,
  ) {
    this.#options = resolveOptions(options);
    this.#parseOptions = options.parseOptions;
    this.#path = path;
    const { data, text } = this._read();
    this.#data = this.#oldData = data;
    this.#text = text;
  }

  [Symbol.dispose]() {
    this._write();
  }

  get data(): T | undefined {
    return this.#data;
  }

  set data(value: T) {
    this.#data = value;
  }

  private _read(): { data: T | undefined; text: string | undefined } {
    if (existsSync(this.#path)) {
      const text = readFileSync(this.#path, { encoding: "utf8" });
      // Handle empty files
      if (text.trim() === "") {
        return { data: undefined, text };
      }
      try {
        const data = this.#parseOptions.parse(text);
        const { validator } = this.#options;
        if (validator != null && !validator(data)) {
          throw new Error(`Invalid data: ${text}`);
        }
        return { data: data as T, text };
      } catch (error) {
        throw new Error(`Failed to parse ${this.#path}: ${error}`);
      }
    }
    if (!this.#options.allowNoExist) {
      throw new Error(`File not found: ${this.#path}`);
    }
    return { data: undefined, text: undefined };
  }

  private _write() {
    if (this.#data == null) {
      return;
    }

    try {
      let content: string;
      if (
        this.#parseOptions.preserveFormat && this.#text != null &&
        this.#oldData != null
      ) {
        content = this.#parseOptions.preserveFormat(
          this.#text,
          this.#oldData,
          this.#data,
        );
      } else {
        content = this.#parseOptions.stringify(this.#data);
      }
      writeFileSync(this.#path, content);
    } catch (error) {
      throw new Error(`Failed to write ${this.#path}: ${error}`);
    }
  }
}

/**
 * Create a text file handler
 * @example
 * ```ts
 * import { createLimoText } from "@ryoppippi/limo";
 * {
 *   using text = createLimoText("file.txt");
 *   text.data = "Hello, World!";
 * }
 * ```
 */
export function createLimoText(
  path: string,
  options: Options<string> = {},
): Limo<string> {
  return new LimoFile(path, {
    ...options,
    parseOptions: {
      parse: (text: string) => text,
      stringify: (data: string) => data,
    },
  });
}

/**
 * Create a JSON file handler
 * @example
 * ```ts
 * import { createLimoJson } from "@ryoppippi/limo";
 * {
 *   using json = createLimoJson("file.json");
 *   json.data = { hello: "world" };
 * }
 * ```
 *
 * @example
 * ```ts
 * // with validator
 * import { createLimoJson } from "@ryoppippi/limo";
 * function validator(data: unknown): data is { hello: string } {
 *   return typeof data === "object" && data != null && "hello" in data;
 * }
 * {
 *   using json = createLimoJson("file.json", { validator });
 *   json.data = { hello: "world" };
 * }
 * ```
 */
export function createLimoJson<T>(
  path: string,
  options: Options<T> = {},
): Limo<T> {
  return new LimoFile(path, {
    ...options,
    parseOptions: {
      parse: (text: string) => JSON.parse(text) as T,
      stringify: (data: T) => JSON.stringify(data, null, 2),
    },
  });
}

/**
 * Create a JSONC file handler
 * JSONC is JSON with comments.
 * @example
 * ```ts
 * import { createLimoJsonc } from "@ryoppippi/limo";
 * {
 *   using jsonc = createLimoJsonc("file.jsonc");
 *   jsonc.data = { hello: "world" };
 * }
 * ```
 *
 * @example
 * ```ts
 * // with validator
 * import { createLimoJsonc } from "@ryoppippi/limo";
 * function validator(data: unknown): data is { hello: string } {
 *   return typeof data === "object" && data != null && "hello" in data;
 * }
 * {
 *   using jsonc = createLimoJsonc("file.jsonc", { validator });
 *   jsonc.data = { hello: "world" };
 * }
 * ```
 */
export function createLimoJsonc<T extends Record<string, unknown>>(
  path: string,
  options: Options<T> = {},
): Limo<T> {
  return new LimoFile(path, {
    ...options,
    parseOptions: {
      parse: (text: string) => jsonc_parser.parse(text) as T,
      stringify: (data: T) => JSON.stringify(data, null, 2),
      preserveFormat: (oldText: string, oldData: T, newData: T) => {
        const edits: jsonc_parser.EditResult[] = [];

        for (const key of Object.keys(oldData ?? {})) {
          if (Object.hasOwn(newData, key)) {
            continue;
          }
          const edit = jsonc_parser.modify(oldText, [key], undefined, {});
          edits.push(edit);
        }

        for (const [key, value] of Object.entries(newData)) {
          const edit = jsonc_parser.modify(oldText, [key], value, {});
          edits.push(edit);
        }

        const newText = jsonc_parser.applyEdits(oldText, edits.flat());

        return jsonc_parser.applyEdits(
          newText,
          jsonc_parser.format(newText, undefined, {}),
        );
      },
    },
  });
}

/**
 * Create a TOML file handler
 * @example
 * ```ts
 * import { createLimoToml } from "@ryoppippi/limo";
 * {
 *   using toml = createLimoToml("file.toml");
 *   toml.data = { hello: "world" };
 * }
 * ```
 *
 * @example
 * ```ts
 * // with validator
 * import { createLimoToml } from "@ryoppippi/limo";
 * function validator(data: unknown): data is { hello: string } {
 *   return typeof data === "object" && data != null && "hello" in data;
 * }
 * {
 *   using toml = createLimoToml("file.toml", { validator });
 *   toml.data = { hello: "world" };
 * }
 * ```
 */
export function createLimoToml<T extends Record<string, unknown>>(
  path: string,
  options: Options<T> = {},
): Limo<T> {
  return new LimoFile(path, {
    ...options,
    parseOptions: {
      parse: (text: string) => std_toml.parse(text) as T,
      stringify: (data: T) => std_toml.stringify(data),
    },
  });
}

/**
 * Create a YAML file handler
 * @example
 * ```ts
 * import { createLimoYaml } from "@ryoppippi/limo";
 * {
 *   using yaml = createLimoYaml("file.yaml");
 *   yaml.data = { hello: "world" };
 * }
 * ```
 *
 * @example
 * ```ts
 * // with validator
 * import { createLimoYaml } from "@ryoppippi/limo";
 * function validator(data: unknown): data is { hello: string } {
 *   return typeof data === "object" && data != null && "hello" in data;
 * }
 * {
 *   using yaml = createLimoYaml("file.yaml", { validator });
 *   yaml.data = { hello: "world" };
 * }
 * ```
 */
export function createLimoYaml<T>(
  path: string,
  options: Options<T> = {},
): Limo<T> {
  return new LimoFile(path, {
    ...options,
    parseOptions: {
      parse: (text: string) => std_yaml.parse(text) as T,
      stringify: (data: T) => std_yaml.stringify(data),
    },
  });
}
