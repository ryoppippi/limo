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
