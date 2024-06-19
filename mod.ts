import { existsSync, readFileSync, writeFileSync } from "node:fs";
import * as jsonc_parser from "jsonc-parser";

type Validator<T> = (value: unknown) => value is T;
interface Limo<T> {
  [Symbol.dispose](): void;

  get data(): T | undefined;
  set data(value: T);
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

  constructor(path: string) {
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
      return readFileSync(this.#path, { encoding: "utf8" });
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
 *   using json = new Json("file.json", validator);
 *   json.data = { hello: "world" };
 * }
 * ```
 */

export class Json<T> implements Limo<T> {
  #data: T | undefined;
  #path: string;

  constructor(
    path: string,
    validator?: Validator<T>,
  ) {
    this.#path = path;
    this.#data = this._read(validator);
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

  private _read(validator?: Validator<T>) {
    if (existsSync(this.#path)) {
      const text = readFileSync(this.#path, { encoding: "utf8" });
      const json = JSON.parse(text) as unknown;
      if (validator != null && !validator(json)) {
        throw new Error(`Invalid data: ${text}`);
      }
      return json as T;
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

export class Jsonc<T> implements Limo<T> {
  #data: T | undefined;
  #old_data: T | undefined;
  #path: string;
  #text: string | undefined;

  constructor(
    path: string,
    validator?: Validator<T>,
  ) {
    this.#path = path;
    const { jsonc, text } = this._read(validator);
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

  private _read(validator?: Validator<T>) {
    if (existsSync(this.#path)) {
      const text = readFileSync(this.#path, { encoding: "utf8" });
      const jsonc = jsonc_parser.parse(text);
      if (validator != null && !validator(jsonc)) {
        throw new Error(`Invalid data: ${text}`);
      }
      return { jsonc: jsonc as T, text };
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
