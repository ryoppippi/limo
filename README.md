# `Limo`

[![JSR](https://jsr.io/badges/@ryoppippi/limo)](https://jsr.io/@ryoppippi/limo)
[![JSR](https://jsr.io/badges/@ryoppippi/limo/score)](https://jsr.io/@ryoppippi/limo)

#### *Lire* + *Memo* = **Limo**

`Limo` is a tiny library for reading and automatically writing files. 
It supports various file formats such as JSON, TOML, YAML, and custom formats with user-defined parse/stringify functions.

## Features

- Read and write files files effortlessly
- Automatic writing of changes back to the file
- Support for JSON, TOML, YAML, and custom file formats
- Custom format support with user-defined parse/stringify functions
- Optional data validation using custom validator functions
- Lightweight and easy to use

## Installation

To use `Limo` in your project, install from `jsr`

```sh
deno add @ryoppippi/limo
npx jsr add @ryoppippi/limo
bunx jsr add @ryoppippi/limo
pnpm dlx jsr add @ryoppippi/limo
yarn dlx jsr add @ryoppippi/limo
```

## Usage

Here's a quick example of how to use `Limo` to read and write a JSON file:

```ts
import { createLimoJson } from "@ryoppippi/limo";

// Read and write a JSON file
{
  using json = createLimoJson("/tmp/config.json");
  json.data = { hello: "world" };
}

// when you exit the block scope, the changes are automatically written back to the file
```

`Limo` uses the `using` statement to automatically write changes back to the file when the block scope ends.

You can also provide a custom validator function to ensure the data is in the expected format:

```ts
import { createLimoJson } from "@ryoppippi/limo";

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
  using json = createLimoJson("/tmp/user.json", { validator });
  json.data = { name: "John", age: 30 };
}
```

### Graceful Validator Failures

By default, if a validator function fails, `Limo` will throw an error. However, you can configure it to return `undefined` instead by setting `allowValidatorFailure` to `true`:

```ts
import { createLimoJson } from "@ryoppippi/limo";
import { writeFileSync } from "node:fs";

interface Config {
  version: string;
  features: string[];
}

function validator(data: unknown): data is Config {
  const config = data as Config;
  return typeof config === "object" && config != null &&
    typeof config.version === "string" && Array.isArray(config.features);
}

// Create a file with invalid content
writeFileSync("/tmp/config.json", '{"invalid": "data"}');

// Graceful failure: returns undefined if validation fails
{
  using json = createLimoJson("/tmp/config.json", { 
    validator, 
    allowValidatorFailure: true 
  });
  
  if (json.data === undefined) {
    // Handle invalid data gracefully
    console.log("Config file is invalid, using defaults");
    json.data = { version: "1.0.0", features: [] };
  } else {
    // Work with valid data
    console.log(`Current version: ${json.data.version}`);
  }
}

// Strict mode: throws error if validation fails (default behavior)
// {
//   using json = createLimoJson("/tmp/config.json", { 
//     validator,
//     allowValidatorFailure: false  // or omit this option
//   });
//   // Will throw an error if validation fails
// }
```

`Limo` supports other file formats as well. Use the corresponding factory functions:

- **Text files**: `createLimoText("file.txt")`
- **JSON files**: `createLimoJson("config.json")`
- **TOML files**: `createLimoToml("config.toml")`
- **YAML files**: `createLimoYaml("config.yaml")`
- **Custom formats**: `createLimoCustom("file.ext", customFormat)`

### Custom Formats

For file formats not built into `Limo`, you can define your own custom format using `createLimoCustom`:

```ts
import { createLimoCustom } from "@ryoppippi/limo";

// Define a CSV format
const csvFormat = {
  parse: (text: string): string[] => text.split(',').map(s => s.trim()),
  stringify: (data: string[]): string => data.join(', ')
};

{
  using csv = createLimoCustom("/tmp/data.csv", csvFormat);
  csv.data = ["apple", "banana", "cherry"];
}
```

You can also define more complex formats with validation:

```ts
import { createLimoCustom } from "@ryoppippi/limo";

interface Config {
  name: string;
  version: number;
}

function validator(data: unknown): data is Config {
  return typeof data === "object" && data != null && 
         "name" in data && "version" in data;
}

const configFormat = {
  parse: (text: string): Config => {
    const lines = text.split('\n').filter(line => line.trim());
    const config = {} as any;
    lines.forEach(line => {
      const [key, value] = line.split('=');
      config[key.trim()] = isNaN(Number(value)) ? value.trim() : Number(value);
    });
    return config;
  },
  stringify: (data: Config): string => 
    Object.entries(data).map(([k, v]) => `${k}=${v}`).join('\n'),
  // Optional: preserve comments and formatting
  preserveFormat: (oldText: string, oldData: Config, newData: Config): string => {
    let result = oldText;
    Object.entries(newData).forEach(([key, value]) => {
      if (oldData[key as keyof Config] !== value) {
        const regex = new RegExp(`^(.*${key}\\s*=\\s*).*$`, 'm');
        result = result.replace(regex, `$1${value}`);
      }
    });
    return result;
  }
};

{
  using config = createLimoCustom("/tmp/app.conf", configFormat, { validator });
  config.data = { name: "myapp", version: 2 };
}
```

The `CustomFormat` interface supports:
- **`parse`**: Convert text content to typed data
- **`stringify`**: Convert typed data back to text content  
- **`preserveFormat`** (optional): Preserve existing file structure and comments when updating


For more detailed usage and examples, please refer to the [API documentation](https://jsr.io/@ryoppippi/limo/doc).

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the [GitHub repository](https://github.com/ryoppippi/limo).

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Author

- [ryoppippi](https://github.com/ryoppippi)

Feel free to reach out if you have any questions or feedback!
