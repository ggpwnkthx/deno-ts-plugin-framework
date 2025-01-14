# Plugin Loader Framework

A lightweight, extensible plugin framework for building modular applications.

## Features

* Event-driven architecture
* Dynamic plugin registration
* Lifecycle management
* Simple API

## Usage

### Example Project Structure

```
├── plugins/
│   ├── errors.ts
│   └── logging.ts
│   └── oak.ts
└── main.ts
```

### Creating Plugins

Define a plugin by implementing the `Plugin` interface:

#### Basic

```typescript
// ./plugins/oak.ts
import type { Plugin } from "jsr:@ggpwnkthk/plugin-framework@2.0.0";
import { Application } from "jsr:@oak/oak";
import { bold, yellow } from "jsr:@std/fmt/colors";

export default {
  name: "http_backend",
  app: new Application(),
  register() {
    this.app.use(async (ctx, next) => {
      ctx.response.body = "Hello, World!";
      await next();
    });
  },
  initialize() {
    this.app.listen("0.0.0.0:8080");
    console.log(
      bold("🚀 Server is running on ") +
        yellow(`http://0.0.0.0:8080`),
    );
  },
} as Plugin & { app: Application };
```

#### Dependency Injection via Events

```typescript
// ./plugins/logging.ts
import type { Plugin } from "jsr:@ggpwnkthk/plugin-framework@2.0.0";
import { bold, cyan, green } from "jsr:@std/fmt/colors";
import type OakPlugin from "./oak.ts"

export default {
  name: "http_backend_logger",
  register(events) {
    events.on<[typeof OakPlugin]>("plugin:http_backend:initializing", (plugin) => {
      plugin.app.use(async (ctx, next) => {
        const start = Date.now();
        await next();
        const ms = Date.now() - start;
        console.log(
          `${green(ctx.request.method)} ${cyan(ctx.request.url.toString())} - ${
            bold(`${ms}ms`)
          }`,
        );
      });
    })
  },
} as Plugin;
```

### Loading Plugins

#### Static

```typescript
// ./main.ts
import { Registry } from "jsr:@ggpwnkthk/plugin-framework@2.0.0";
import PluginA from "./plugins/a.ts"
import PluginD from "./plugins/d.ts"
import PluginF from "./plugins/f.ts"

new Registry([PluginA, PluginF, PluginD])
```

#### Dynamic

```typescript
// ./main.ts
import { Registry, type Plugin } from "jsr:@ggpwnkthk/plugin-framework@2.0.0";
import { walk } from "jsr:@std/fs/walk";

const plugins: Plugin[] = [];
for await (const path of walk("./plugins")) {
  path.isFile && plugins.push((await import(`./${path.path}`)).default);
}

new Registry(plugins)
```

```
$ deno -RN main.ts
Emitting event: plugin:http_backend:registering
Emitting event: plugin:http_backend:registered
Emitting event: plugin:http_backend_logger:registering
Emitting event: plugin:http_backend_logger:registered
Emitting event: core:registered
Emitting event: core:initializing
Emitting event: plugin:http_backend:initializing
🚀 Server is running on http://0.0.0.0:8080
Emitting event: plugin:http_backend:initialized
Emitting event: core:initialized
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.