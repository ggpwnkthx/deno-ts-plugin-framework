// ./types.ts
import type Loader from "./mod.ts";

/**
 * Type representing a dependency that a plugin may have on another plugin or resource.
 * 
 * - `name`: The name of the dependency, used to identify it.
 * - `optional` (optional): A boolean indicating whether the dependency is optional.
 *   If `true`, the plugin can still function without this dependency being resolved.
 */
type Dependency = {
  name: string; // The identifier for the dependency
  optional?: boolean; // Whether the dependency is optional
};

/**
 * Type alias for the exports provided by a plugin. This can be any data type or undefined.
 * Plugins may export functionalities or data to be used by other parts of the system.
 */
type Exports = any | undefined;

/**
 * Type representing a plugin in the system. A plugin is a modular unit that provides
 * specific functionality and can depend on other plugins.
 * 
 * @template TExports - The type of the exports provided by the plugin. Defaults to `undefined`.
 */
export type Plugin<TExports extends Exports = undefined> = {
  /**
   * The unique name of the plugin. This name is used to identify and reference the plugin.
   */
  name: string;

  /**
   * The version of the plugin, usually in a semantic versioning format (e.g., "1.0.0").
   */
  version: string;

  /**
   * The exports provided by the plugin. This can be any data or functionality
   * that the plugin exposes to the system or other plugins.
   */
  exports: TExports;

  /**
   * An optional list of dependencies that the plugin requires. Each dependency is an object
   * with a `name` and an optional `optional` flag.
   */
  dependsOn?: Dependency[];

  /**
   * The initialization function for the plugin. This function is called when the plugin is initialized
   * and can be asynchronous or synchronous.
   * 
   * @param loader - The `Loader` instance responsible for managing plugin operations.
   * 
   * @returns A promise resolving to a string or void, or a string/void directly. The string can
   *          be used for logging or debugging purposes.
   */
  init(loader: Loader): Promise<string | void> | string | void;

  /**
   * An optional method that is called after all plugins have been initialized. This allows the plugin
   * to perform any final setup that depends on the state of other plugins.
   * 
   * @param loader - The `Loader` instance responsible for managing plugin operations.
   * 
   * @returns A promise resolving to a string or void, or a string/void directly. The string can
   *          be used for logging or debugging purposes.
   */
  afterInitAll?(loader: Loader): Promise<string | void> | string | void;
};
