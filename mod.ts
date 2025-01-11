// ./mod.ts
import type { Plugin } from "./types.ts";
import Registry from "./registry.ts";
import { bold, cyan, green } from "jsr:@std/fmt@1.0.4/colors";

/**
 * The `Loader` class is responsible for managing the lifecycle of plugins,
 * including registration, dependency resolution, initialization, and starting.
 */
export default class Loader {
  /**
   * A private registry instance that stores and manages registered plugins.
   */
  private registry: Registry;

  /**
   * Public configuration object that can be used to configure the loader or its plugins.
   */
  public config: any;

  /**
   * Constructs a new `Loader` instance.
   * 
   * @param config - A configuration object for the loader. Defaults to an empty object.
   * @param plugins - An optional array of plugins to register during loader initialization.
   */
  constructor(config: any = {}, plugins: Plugin[] = []) {
    this.registry = new Registry(); // Initialize the plugin registry
    this.registerPlugins(plugins); // Register provided plugins
    this.config = config; // Store the configuration object
  }

  /**
   * Registers a single plugin in the registry.
   * 
   * @param plugin - The plugin to register.
   */
  public registerPlugin(plugin: Plugin) {
    this.registry.register(plugin);
  }

  /**
   * Registers multiple plugins by iterating over the provided array of plugins.
   * 
   * @param plugins - An array of plugins to register.
   */
  public registerPlugins(plugins: Plugin[]) {
    for (const p of plugins) {
      this.registerPlugin(p);
    }
  }

  /**
   * Starts the plugin system by ensuring all plugins are loaded, sorted by dependencies,
   * initialized, and started.
   * 
   * 1. Loads plugins from a default directory if none are registered.
   * 2. Resolves dependencies to determine the order of initialization.
   * 3. Calls the `init` method on each plugin to initialize them.
   * 4. Calls the `afterInitAll` method on each plugin to finalize startup.
   */
  public async start() {
    if (this.registry.all().length === 0) {
      // Load plugins from the default plugins directory
      const plugins = await this.loadPluginsRecursively(
        `${Deno.cwd()}/plugins`,
      );
      this.registerPlugins(plugins);
    }

    // Sort plugins by their dependencies
    const sorted = this.sortByDependencies(this.registry.all());

    // Initialize each plugin in the sorted order
    for (const plugin of sorted) {
      console.log(`Initializing plugin: ${bold(cyan(plugin.name))}`);
      const message = await plugin.init(this);
      message && console.log("  " + message);
    }

    // Call afterInitAll on each plugin in reverse order
    for (const plugin of sorted.reverse()) {
      if (plugin.afterInitAll) {
        console.log(`Starting plugin: ${bold(green(plugin.name))}`);
        const message = await plugin.afterInitAll(this);
        message && console.log("  " + message);
      }
    }
  }

  /**
   * Recursively loads plugins from a given directory and its subdirectories.
   * 
   * @param directory - The directory to search for plugins.
   * @returns A promise resolving to an array of loaded plugins.
   */
  private async loadPluginsRecursively(directory: string): Promise<Plugin[]> {
    const plugins: Plugin[] = [];
    for await (const entry of Deno.readDir(directory)) {
      const fullPath = `${Deno.cwd()}/${directory}/${entry.name}`;
      if (entry.isDirectory) {
        // Recursively load plugins from subdirectories
        plugins.push(...await this.loadPluginsRecursively(fullPath));
      } else if (entry.isFile && entry.name.endsWith(".ts")) {
        // Import the plugin module
        const module = await import(fullPath);
        if (module.default) {
          plugins.push(module.default as Plugin); // Add the plugin to the list
        }
      }
    }
    return plugins;
  }

  /**
   * Sorts plugins based on their dependencies, ensuring dependent plugins
   * are initialized before the plugins that depend on them.
   * 
   * @param plugins - An array of plugins to sort.
   * @returns A sorted array of plugins.
   * 
   * @throws If a circular dependency is detected or if a required dependency is missing.
   */
  private sortByDependencies(plugins: Plugin[]): Plugin[] {
    const sorted: Plugin[] = [];
    const visited: Set<string> = new Set();

    /**
     * Visits a plugin and its dependencies recursively to determine the sort order.
     * 
     * @param p - The current plugin to visit.
     * @param stack - The current stack of plugins being visited, used to detect circular dependencies.
     */
    const visit = (p: Plugin, stack: string[]) => {
      if (visited.has(p.name)) return; // Skip already visited plugins
      if (stack.includes(p.name)) {
        // Circular dependency detected
        throw new Error(
          `Circular dependency detected: ${stack.join(" -> ")} -> ${p.name}`,
        );
      }

      stack.push(p.name); // Add plugin to the stack

      // Resolve dependencies
      if (p.dependsOn) {
        for (const dep of p.dependsOn) {
          const foundDep = plugins.find((x) => x.name === dep.name);
          if (!foundDep) {
            if (dep.optional) {
              console.warn(
                `Optional dependency "${dep.name}" for plugin "${p.name}" not found. Skipping.`,
              );
              continue; // Skip missing optional dependencies
            } else {
              // Required dependency is missing
              throw new Error(
                `Missing dependency: Plugin "${p.name}" depends on "${dep.name}" which is not registered.`,
              );
            }
          }
          visit(foundDep, stack); // Visit the dependency
        }
      }

      stack.pop(); // Remove the plugin from the stack
      visited.add(p.name); // Mark the plugin as visited
      sorted.push(p); // Add the plugin to the sorted list
    };

    for (const plugin of plugins) {
      visit(plugin, []);
    }

    return sorted; // Return the sorted array of plugins
  }
}
