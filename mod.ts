import { existsSync, readFileSync, writeFileSync } from "node:fs";
import * as jsonc_parser from "jsonc-parser";
import * as std_toml from "@std/toml";

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

/**
 * Text
 *
 * Read and automatically write text files.
 * @example
 * ```ts
 * import { Text } from "@ryoppippi/limo";
 * {
 *   using text = new Text("file.txt");
 *   text.data = "Hello, World!";
 * }
 * ```
 */
export class Text implements Limo<string> {
  #data: string | undefined;
  #path: string;
  #options: ResolvedOptions<string>;

  constructor(path: string, options: Options<string> = {}) {
    this.#options = resolveOptions(options);
    this.#path = path;
    this.#data = this._read();
  }

  [Symbol.dispose]() {
    this._write();
  }

  get data(): string | undefined {
    return this.#data;
  }

  set data(value: string) {
    this.#data = value;
  }

  private _read() {
    if (existsSync(this.#path)) {
      const data = readFileSync(this.#path, { encoding: "utf8" });
      const { validator } = this.#options;
      if (validator != null && !validator(data)) {
        throw new Error(`Invalid data: ${data}`);
      }
      return data;
    }
    if (!this.#options.allowNoExist) {
      throw new Error(`File not found: ${this.#path}`);
    }
    return undefined;
  }

  private _write() {
    if (this.#data == null) {
      return;
    }

    writeFileSync(this.#path, this.#data);
  }
}

/**
 * Read and automatically write JSON files.
 * You can pass a validator function to validate the data.
 * @example
 * ```ts
 * // without validator
 * import { Json } from "@ryoppippi/limo";
 * {
 *   using json = new Json("file.json");
 *   json.data = { hello: "world" };
 * }
 * ```
 *
 * @example
 * ```ts
 * // with validator
 * import { Json } from "@ryoppippi/limo";
 * function validator(data: unknown): data is { hello: string } {
 *   return typeof data === "object" && data != null && "hello" in data;
 * }
 * {
 *   using json = new Json("file.json", { validator });
 *   json.data = { hello: "world" };
 * }
 * ```
 */

export class Json<T> implements Limo<T> {
  #data: T | undefined;
  #path: string;
  #options: ResolvedOptions<T>;

  constructor(
    path: string,
    options: Options<T> = {},
  ) {
    this.#options = resolveOptions(options);
    this.#path = path;
    this.#data = this._read();
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

  private _read() {
    if (existsSync(this.#path)) {
      const text = readFileSync(this.#path, { encoding: "utf8" });
      const json = JSON.parse(text) as unknown;
      const { validator } = this.#options;
      if (validator != null && !validator(json)) {
        throw new Error(`Invalid data: ${text}`);
      }
      return json as T;
    }
    if (!this.#options.allowNoExist) {
      throw new Error(`File not found: ${this.#path}`);
    }
    return undefined;
  }

  private _write() {
    if (this.#data == null) {
      return;
    }

    writeFileSync(this.#path, JSON.stringify(this.#data, null, 2));
  }
}

/**
 * Read and automatically write JSONC files.
 * JSONC is a JSON with comments.
 * You can pass a validator
 * function to validate the data.
 *
 * @example
 * ```ts
 * // without validator
 * import { Jsonc } from "@ryoppippi/limo";
 * {
 *   using jsonc = new Jsonc("file.jsonc");
 *   jsonc.data = { hello: "world" };
 * }
 * ```
 *
 * @example
 * ```ts
 * // with validator
 * import { Jsonc } from "@ryoppippi/limo";
 * function validator(data: unknown): data is { hello: string } {
 *   return typeof data === "object" && data != null && "hello" in data;
 * }
 * {
 *   using jsonc = new Jsonc("file.jsonc", { validator });
 *   jsonc.data = { hello: "world" };
 * }
 * ```
 */
export class Jsonc<T> implements Limo<T> {
  #data: T | undefined;
  #old_data: T | undefined;
  #path: string;
  #text: string | undefined;
  #options: ResolvedOptions<T>;

  constructor(
    path: string,
    options: Options<T> = {},
  ) {
    this.#options = resolveOptions(options);
    this.#path = path;
    const { jsonc, text } = this._read();
    this.#data = this.#old_data = jsonc;
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

  private _read() {
    if (existsSync(this.#path)) {
      const text = readFileSync(this.#path, { encoding: "utf8" });
      const jsonc = jsonc_parser.parse(text);
      const { validator } = this.#options;
      if (validator != null && !validator(jsonc)) {
        throw new Error(`Invalid data: ${text}`);
      }
      return { jsonc: jsonc as T, text };
    }
    if (!this.#options.allowNoExist) {
      throw new Error(`File not found: ${this.#path}`);
    }
    return { jsonc: undefined, text: undefined };
  }

  private _write() {
    if (this.#data == null) {
      return;
    }

    const text = this.#text ?? "";

    const edits: jsonc_parser.EditResult[] = [];

    for (const key of Object.keys(this.#old_data ?? {})) {
      if (Object.hasOwn(this.#data, key)) {
        continue;
      }
      const edit = jsonc_parser.modify(text, [key], undefined, {});
      edits.push(edit);
    }

    for (const [key, value] of Object.entries(this.#data)) {
      const edit = jsonc_parser.modify(text, [key], value, {});
      edits.push(edit);
    }

    const newText = jsonc_parser.applyEdits(text, edits.flat());

    const formatted = jsonc_parser.applyEdits(
      newText,
      jsonc_parser.format(newText, undefined, {}),
    );
    writeFileSync(this.#path, formatted);
  }
}

/**
 * Read and automatically write TOML files.
 * You can pass a validator function to validate the data.
 * @example
 * ```ts
 * // without validator
 * import { Toml } from "@ryoppippi/limo";
 * {
 *   using toml = new Toml("file.toml");
 *   toml.data = { hello: "world" };
 * }
 * ```
 *
 * @example
 * ```ts
 * // with validator
 * import { Toml } from "@ryoppippi/limo";
 * function validator(data: unknown): data is { hello: string } {
 *   return typeof data === "object" && data != null && "hello" in data;
 * }
 * {
 *   using toml = new Toml("file.toml", { validator });
 *   toml.data = { hello: "world" };
 * }
 * ```
 */
export class Toml<T> implements Limo<T> {
  #data: T | undefined;
  #path: string;
  #options: ResolvedOptions<T>;

  constructor(
    path: string,
    options: Options<T> = {},
  ) {
    this.#options = resolveOptions(options);
    this.#path = path;
    this.#data = this._read();
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

  private _read() {
    if (existsSync(this.#path)) {
      const text = readFileSync(this.#path, { encoding: "utf8" });
      const toml = std_toml.parse(text);
      const { validator } = this.#options;
      if (validator != null && !validator(toml)) {
        throw new Error(`Invalid data: ${text}`);
      }
      return toml as T;
    }
    if (!this.#options.allowNoExist) {
      throw new Error(`File not found: ${this.#path}`);
    }
    return undefined;
  }

  private _write() {
    if (this.#data == null) {
      return;
    }

    writeFileSync(this.#path, std_toml.stringify(this.#data));
  }
}
