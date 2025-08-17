# `Limo`

[![JSR](https://jsr.io/badges/@ryoppippi/limo)](https://jsr.io/@ryoppippi/limo)
[![JSR](https://jsr.io/badges/@ryoppippi/limo/score)](https://jsr.io/@ryoppippi/limo)

#### *Lire* + *Memo* = **Limo**

`Limo` is a tiny library for reading and automatically writing files. 
It supports various file formats such as JSON, JSONC (JSON with comments), TOML, and YAML.

## Features

- Read and write files files effortlessly
- Automatic writing of changes back to the file
- Support for JSON, JSONC, TOML, and YAML file formats
- Optional data validation using custom validator functions
- Lightweight and easy to use

## Installation

To use `Limo` in your project, install from `npm` or `jsr`:

### From npm
```sh
npm install @ryoppippi/limo
bun add @ryoppippi/limo
pnpm add @ryoppippi/limo
yarn add @ryoppippi/limo
```

### From JSR
```sh
npx jsr add @ryoppippi/limo
bunx jsr add @ryoppippi/limo
pnpm dlx jsr add @ryoppippi/limo
yarn dlx jsr add @ryoppippi/limo
deno add @ryoppippi/limo
```

## Usage

Here's a quick example of how to use `Limo` to read and write a JSON file:

```ts
import { Json } from "@ryoppippi/limo";

// Read and write a JSON file
{
  using json = new Json("config.json");
  json.data = { hello: "world" };
}

// when you exit the block scope, the changes are automatically written back to the file
```

`Limo` uses the `using` statement to automatically write changes back to the file when the block scope ends.

You can also provide a custom validator function to ensure the data is in the expected format:

```ts
import { Json } from "@ryoppippi/limo";

// Validator function
interface Data {
  name: string;
  age: number;
}

function validator(_data: unknown): _data is Data {
  const data = _data as Data;
  return typeof data === "object" && data != null &&
    typeof data.name === "string" && typeof data.age === "number";
}

// Read and write a JSON file with validation
{
  using json = new Json("config.json", { validator });
  json.data = { name: "John", age: 30 };
}
```

`Limo` supports other file formats as well, such as JSONC, TOML, and YAML. Simply use the corresponding class (`Jsonc`, `Toml`, `Yaml`) in a similar manner.

For more detailed usage and examples, please refer to the [API documentation](https://jsr.io/@ryoppippi/limo/doc).

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the [GitHub repository](https://github.com/ryoppippi/limo).

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Author

- [ryoppippi](https://github.com/ryoppippi)

Feel free to reach out if you have any questions or feedback!
