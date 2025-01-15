# Plugin Loader Framework

A lightweight, extensible plugin framework for building modular applications.

## Features

* Event-driven architecture
* Dynamic plugin registration
* Lifecycle management
* Simple API

## Usage

See the `examples` directory for more use cases.

### Example Project Structure

```
├── plugins/
│   ├── api.ts
│   └── config.ts
│   └── db.ts
└── main.ts
```

### Creating Plugins

Define a plugin by implementing the `Plugin` interface:

#### Basic

```typescript
// ./plugins/config.ts
import type { Plugin } from "jsr:@ggpwnkthk/plugin-framework@2.1.0";
export default {
  name: "ConfigPlugin",
  initialize() {
    console.log("[ConfigPlugin] Loading configuration...");
    // For this example, assume config loaded instantly.
    console.log("[ConfigPlugin] Configuration loaded.");
  },
} as Plugin;
```

#### Dependency Injection

##### Single Dependency

```typescript
// ./plugins/db.ts
import type { Plugin } from "jsr:@ggpwnkthk/plugin-framework@2.1.0";
export default {
  name: "DatabasePlugin",
  register(events) {
    // Wait for ConfigPlugin to be fully initialized before doing additional tasks.
    events.on({
      condition: "all",
      events: ["plugin.ConfigPlugin.initialized"],
      listener: (plugins) => {
        const configPlugin = plugins.get("ConfigPlugin");
        // Access configuration details from ConfigPlugin if needed.
        console.log(
          "[DatabasePlugin] Detected that ConfigPlugin is initialized. Reading configuration...",
        );
        // (Imagine reading a connection string or similar configuration here.)
      },
    });
  },
} as Plugin;
```
##### Multiple Dependencies

```typescript
// ./plugins/api.ts
import type { Plugin } from "jsr:@ggpwnkthk/plugin-framework@2.1.0";
export default {
  name: "APIPlugin",
  register(events) {
    // Wait for both ConfigPlugin and DatabasePlugin to be initialized.
    events.on({
      condition: "all",
      events: [
        "plugin.ConfigPlugin.initialized",
        "plugin.DatabasePlugin.initialized",
      ],
      listener: (plugins) => {
        const configPlugin = plugins.get("ConfigPlugin");
        const databasePlugin = plugins.get("DatabasePlugin");
        console.log(
          "[APIPlugin] Detected both Config and Database are ready.",
        );
        // Now, APIPlugin can use functionalities exposed by these plugins.
        console.log(
          "[APIPlugin] Setting up API endpoints using configuration and database connection.",
        );
      },
    });

    // Additionally, we could listen for any one event if we want an earlier reaction.
    events.on({
      condition: "any",
      events: ["plugin.ConfigPlugin.initialized", "plugin.DatabasePlugin.initialized"],
      listener: () => {
        console.log(
          "[APIPlugin] At least one dependency (Config or Database) is initialized so far.",
        );
      },
    });
  },
  initialize() {
    // API initialization steps that don't depend on the other plugins.
    console.log("[APIPlugin] Initializing core API functionality...");
    // More initialization logic could be here.
  },
} as Plugin;
```

### Loading Plugins

#### Static

```typescript
// ./main.ts
import { Registry } from "jsr:@ggpwnkthk/plugin-framework@2.1.0";
import APIPlugin from "./plugins/api.ts"
import ConfigPlugin from "./plugins/config.ts"
import DatabasePlugin from "./plugins/db.ts"

new Registry([ConfigPlugin, DatabasePlugin, APIPlugin])
```

#### Dynamic

```typescript
// ./main.ts
import { Registry, type Plugin } from "jsr:@ggpwnkthk/plugin-framework@2.1.0";
import { walk } from "jsr:@std/fs/walk";

const plugins: Plugin[] = [];
for await (const path of walk("./plugins")) {
  path.isFile && plugins.push((await import(`./${path.path}`)).default);
}

new Registry(plugins)
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.