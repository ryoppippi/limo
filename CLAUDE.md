# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a Deno project. Use these commands for development:

- `deno task check` - Type check all TypeScript files and check formatting
- `deno task lint` - Lint all TypeScript files
- `deno task test` - Run all tests with documentation tests included
- `deno task test:coverage` - Run tests with coverage reporting
- `deno task coverage:show` - Display coverage results
- `deno task dev` - Run the module with file watching for development

**IMPORTANT**: Always run `deno task check` and `deno task lint` before committing changes.

## Architecture

Limo is a lightweight file I/O library that uses the `using` statement for automatic resource management. The core architecture:

### Core Components

- **LimoFile class** (`mod.ts:44-124`): Internal unified class implementing the Limo interface with Symbol.dispose for automatic file writing
- **Factory functions**: Public API functions that create LimoFile instances with format-specific parsing:
  - `createLimoText()` - Plain text files
  - `createLimoJson()` - JSON files with 2-space indentation
  - `createLimoJsonc()` - JSON with comments, preserves formatting and comments
  - `createLimoToml()` - TOML files using @std/toml
  - `createLimoYaml()` - YAML files using @std/yaml

### Key Design Patterns

1. **Using Statement Pattern**: All file operations use `using` declarations for automatic cleanup via Symbol.dispose
2. **Validator Pattern**: Optional type validation functions can be provided to ensure data integrity
3. **Format Preservation**: JSONC files preserve comments and formatting when possible using jsonc-parser
4. **Lazy Writing**: Files are only written when the `using` block exits and data has been modified

### Dependencies

- `node:fs` for file operations
- `jsonc-parser` for JSONC support with comment preservation
- `@std/toml`, `@std/yaml` for TOML/YAML parsing
- `fs-fixture` for test file management

### Testing Strategy

Tests use `fs-fixture` for temporary file management and `@cross/test` as the test runner. All factory functions are tested with and without validators, and format preservation is specifically tested for JSONC.