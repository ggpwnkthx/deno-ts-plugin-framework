# Plugin Loader Framework

A modular, extensible framework for managing plugins with dependency resolution, lifecycle management, and dynamic loading. This system is designed to simplify the process of working with plugins, ensuring they are initialized, started, and resolved in the correct order.

## Features

- **Dependency Management**: Automatically resolves and enforces dependencies between plugins.
- **Lifecycle Management**: Ensures plugins are initialized and started in the correct order.
- **Type Safety**: Strong TypeScript types for plugins and dependencies.

## File Overview

### `mod.ts`
Contains the `Loader` class, which:
- Manages the lifecycle of plugins.
- Provides methods for registering and initializing plugins.
- Handles dependency resolution and dynamic plugin loading.

### `registry.ts`
Defines the `Registry` class, responsible for:
- Storing and managing registered plugins.
- Ensuring unique plugin registration.
- Allowing retrieval of plugins by name or as a list.

### `types.ts`
Defines core TypeScript types, including:
- `Plugin`: Represents a plugin with optional dependencies, initialization, and lifecycle methods.
- `Dependency`: Represents a dependency required by a plugin.

## Usage

### 1. Creating a Plugin

Define a plugin by implementing the `Plugin` interface:

```typescript
// ./plugins/my-plugin.ts
import { Plugin } from "./types.ts";

export default {
  name: "my-plugin",
  version: "1.0.0",
  exports: {},

  init: async (loader) => {
    console.log("Initializing MyPlugin...");
    return `MyPlugin initialized: ${loader.config.server} `;
  },

  afterInitAll: (loader) => {
    console.log("Finalizing MyPlugin setup...");
    return "MyPlugin started.";
  },
} satisfies Plugin;
```

### 2. Loading Plugins

Create an instance of Loader and register plugins:

```typescript
// ./main.ts
import Loader from "./mod.ts";
import MyPlugin from "./plugins/my-plugin.ts";

const app = new Loader({ server: "localhost:8080" }, [MyPlugin]);

await app.start();
```

## Example Project Structure

```
├── plugins/
│   ├── plugin-a.ts
│   └── plugin-b.ts
└── main.ts
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.