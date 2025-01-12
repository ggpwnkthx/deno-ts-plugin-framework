# Plugin Loader Framework

A modular, extensible framework for managing plugins with dependency resolution, lifecycle management, and dynamic loading. This system is designed to simplify the process of working with plugins, ensuring they are initialized, started, and resolved in the correct order.

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
import type { Plugin } from "jsr:@ggpwnkthk/plugin-framework@1.0.0";
import { Application } from "jsr:@oak/oak";
import { bold, yellow } from "jsr:@std/fmt/colors";
export default {
  name: "oak", // Unique name for the plugin
  version: "0.0.1",
  exports: new Application(), // Standard property name for accessible objects
  init() {
    this.exports.use(async (ctx, next) => {
      ctx.response.body = "Hello, World!";
      await next();
    });
  },
  afterInitAll(context) {
    this.exports.listen(context.config.server);
    return bold("🚀 Server is running on ") +
      yellow(`http://${context.config.server}`);
  },
} satisfies Plugin<Application>;
```

#### Dependency

```typescript
// ./plugins/logging.ts
import type { Plugin } from "jsr:@ggpwnkthk/plugin-framework@1.0.0";
import { bold, cyan, green } from "jsr:@std/fmt/colors";
import app from "./oak.ts";
export default {
  name: "oak_logging",
  version: "0.0.1",
  dependsOn: [
    { name: "oak" },
  ],
  exports: undefined,
  init() {
    app.exports.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      console.log(
        `${green(ctx.request.method)} ${cyan(ctx.request.url.toString())} - ${
          bold(`${ms}ms`)
        }`,
      );
    });
  },
} satisfies Plugin;
```

#### Optional Dependancy

```typescript
// ./plugins/errors.ts
import type { Plugin } from "jsr:@ggpwnkthk/plugin-framework@1.0.0";
import { bold, red } from "jsr:@std/fmt/colors";
import app from "./oak.ts";
import { HttpError } from "jsr:@oak/commons@1/http_errors";
import { Status } from "jsr:@oak/commons@1/status";
export default {
  name: "oak_errors",
  version: "0.0.1",
  dependsOn: [
    { name: "oak" },
    { name: "oak_logging", optional: true },
  ],
  exports: undefined,
  init() {
    app.exports.use(async (oakContext, next) => {
      try {
        await next();
      } catch (e) {
        if (e instanceof HttpError) {
          oakContext.response.status = e.status;
          oakContext.response.body = e.expose
            ? `${e.status} - ${e.message}`
            : `${e.status} - ${Status[e.status]}`;
        } else {
          oakContext.response.status = 500;
          oakContext.response.body = "500 - Internal Server Error";
        }
        console.error(red(bold("Error: ")), e);
      }
    });
  },
} satisfies Plugin;
```

### Loading Plugins

#### Manually

```typescript
// ./main.ts
import Loader from "./mod.ts";
import MyPlugin from "./plugins/my-plugin.ts";

const app = new Loader({ server: "localhost:8080" }, [MyPlugin]);

await app.start();
```

#### Automatic

```typescript
// ./main.ts
import Loader, { type Plugin } from "jsr:@ggpwnkthk/plugin-framework@1.0.0";
import { walk } from "jsr:@std/fs/walk";

const plugins: Plugin[] = [];
for await (const path of walk("./plugins")) {
  path.isFile && plugins.push((await import(`./${path.path}`)).default);
}

await new Loader({ server: "localhost:8080" }, plugins).start();
```

```
$ deno -RN main.ts
Initializing plugin: oak
Initializing plugin: oak_logging
Initializing plugin: oak_errors
Starting plugin: oak
  🚀 Server is running on http://localhost:8080
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.