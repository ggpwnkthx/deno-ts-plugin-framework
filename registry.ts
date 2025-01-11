// ./registry.ts
import type { Plugin } from "./types.ts";

/**
 * The `Registry` class manages the storage and retrieval of plugins.
 * 
 * This class acts as a centralized repository for all plugins, ensuring that
 * plugins are uniquely registered and can be retrieved or iterated as needed.
 */
export default class Registry {
  /**
   * A private map to store plugins, using the plugin name as the key and the plugin object as the value.
   */
  private plugins: Map<string, Plugin> = new Map();

  /**
   * Registers a plugin in the registry.
   * 
   * @param plugin - The plugin to register.
   * @throws If a plugin with the same name is already registered, an error is thrown.
   */
  public register(plugin: Plugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered.`);
    }
    this.plugins.set(plugin.name, plugin); // Add the plugin to the registry
  }

  /**
   * Retrieves a plugin from the registry by its name.
   * 
   * @template T - The expected type of the plugin. Defaults to the base `Plugin` type.
   * @param pluginName - The name of the plugin to retrieve.
   * @returns The plugin object.
   * @throws If the plugin is not found, an error is thrown.
   */
  public getPlugin<T extends Plugin = Plugin>(pluginName: string): T {
    const plugin = this.plugins.get(pluginName); // Attempt to retrieve the plugin
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" is not registered.`); // Throw error if not found
    }
    return plugin as T; // Return the plugin cast to the specified type
  }

  /**
   * Retrieves all registered plugins as an array.
   * 
   * @returns An array containing all registered plugins.
   */
  public all(): Plugin[] {
    return [...this.plugins.values()]; // Return all plugin objects as an array
  }
}
