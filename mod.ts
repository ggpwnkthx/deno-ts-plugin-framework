// ./mod.ts
/**
 * A function type representing a listener for events.
 * The listener accepts an arbitrary number of arguments of specified types.
 * @template TArgs - A tuple type representing the arguments the listener accepts.
 */
type Listener<TArgs extends unknown[] = unknown[]> = (...args: TArgs) => void;

/**
 * A class that extends the built-in `Map` to handle event-driven programming.
 * Events can be registered with listeners, and these listeners can be triggered
 * (or "emitted") with specific arguments.
 */
export class Events extends Map<string, Listener<any[]>[]> {
  /**
   * Registers a listener for a specific event.
   * @param event - The name of the event to listen to.
   * @param listener - The function to invoke when the event is emitted.
   * @returns The current instance of the `Events` class for chaining.
   */
  on<TArgs extends unknown[] = unknown[]>(event: string, listener: Listener<TArgs>): this {
    // Ensure the event has a list of listeners initialized
    if (!this.has(event)) {
      this.set(event, []);
    }
    // Add the listener to the list of listeners for the event
    this.get(event)!.push(listener);
    return this;
  }

  /**
   * Emits (triggers) an event, invoking all listeners registered for that event
   * with the specified arguments.
   * @param event - The name of the event to emit.
   * @param args - The arguments to pass to each listener.
   */
  emit<TArgs extends unknown[]>(event: string, ...args: TArgs): void {
    console.debug(`Emitting event: ${event}`); // Log the emitted event
    // Call each listener registered for the event with the provided arguments
    this.get(event)?.forEach((listener) => listener(...args));
  }
}

/**
 * An interface representing a plugin that can be registered with the `Registry`.
 * Plugins can define a name, optional `register` and `initialize` lifecycle methods.
 */
export interface Plugin {
  /** The unique name of the plugin. */
  name: string;

  /**
   * An optional method called when the plugin is registered with the `Registry`.
   * @param events - The `Events` instance used for event handling.
   */
  register?(events: Events): void;

  /**
   * An optional method called during the initialization phase of the plugin.
   */
  initialize?(): void;
}

/**
 * A class to manage the lifecycle of plugins and handle event-driven communication
 * between them. It initializes and registers plugins, and manages a shared event bus.
 */
export class Registry {
  /** A map of registered plugins, keyed by their names. */
  private plugins = new Map<string, Plugin>();

  /** The shared event bus for the plugins and the core registry. */
  private events = new Events();

  /**
   * Constructs a `Registry` instance and initializes the provided plugins.
   * @param plugins - An optional array of plugins to register and initialize.
   */
  constructor(plugins: Plugin[] = []) {
    // Register each plugin provided during initialization
    plugins.forEach((plugin) => this.register(plugin));
    
    // Emit lifecycle events for the core registry
    this.events.emit("core.registered", plugins);
    this.events.emit("core.initializing", this.plugins);

    // Initialize all registered plugins
    this.initialize();

    // Emit the final lifecycle event after initialization
    this.events.emit("core.initialized", this.plugins);
  }

  /**
   * Registers a plugin with the `Registry`.
   * This method is private and is called internally during the constructor or manually.
   * @param plugin - The plugin to register.
   * @throws If a plugin with the same name is already registered.
   */
  private register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      // Prevent duplicate plugin registration
      throw new Error(`Plugin with name '${plugin.name}' is already registered.`);
    }

    // Emit an event indicating that the plugin is about to be registered
    this.events.emit(`plugin.${plugin.name}.registering`);

    // Add the plugin to the registry
    this.plugins.set(plugin.name, plugin);

    // Call the plugin's optional register method
    plugin.register?.(this.events);

    // Emit an event indicating that the plugin has been successfully registered
    this.events.emit(`plugin.${plugin.name}.registered`);
  }

  /**
   * Initializes all registered plugins by calling their `initialize` method (if defined).
   * This method is private and is called internally during the constructor.
   */
  private initialize(): void {
    // Iterate over all registered plugins
    for (const plugin of this.plugins.values()) {
      if (plugin.initialize) {
        // Emit an event indicating that the plugin is about to be initialized
        this.events.emit(`plugin.${plugin.name}.initializing`, plugin);

        // Call the plugin's `initialize` method
        plugin.initialize?.();

        // Emit an event indicating that the plugin has been initialized
        this.events.emit(`plugin.${plugin.name}.initialized`, plugin);
      }
    }
  }
}
