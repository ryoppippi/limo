import { existsSync, readFileSync, writeFileSync } from "node:fs";

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

export class Json<T> implements Limo<T> {
  #data: T | undefined;
  #path: string;

  constructor(
    path: string,
    validator?: (value: unknown) => value is T,
  ) {
    this.#path = path;
    const data = this._read();

    if (data != null && validator != null && validator(data)) {
      this.#data = data;
    }
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
      return JSON.parse(readFileSync(this.#path, { encoding: "utf8" }));
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
