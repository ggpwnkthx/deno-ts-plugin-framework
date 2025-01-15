// ./mod.ts

/**
 * Represents the type of conditional trigger that can be applied when
 * listening for events.
 *
 * - "single" : A single specific event.
 * - "any"    : Fires if any one of the events is emitted.
 * - "all"    : Fires only when all specified events have been emitted.
 */
type ConditionType = "single" | "any" | "all";

/**
 * A function type representing a listener for events.
 *
 * @param plugins - The collection of registered plugins from the registry.
 */
type Listener = (plugins: Map<string, Plugin>) => void;

/**
 * Represents a conditional trigger configuration, detailing the condition type,
 * the events to watch for, and the listener function to execute when the condition is met.
 */
interface ConditionalTrigger {
  /** The condition type which determines how the events are evaluated. */
  condition: ConditionType;
  /** An array of event names associated with this trigger. */
  events: string[];
  /** The listener function to call when the condition is fulfilled. */
  listener: Listener;
}

/**
 * The Events class extends a Map to track events, their associated listeners,
 * and whether they have been fired. It also handles conditional triggers that
 * depend on one or more events.
 *
 * @extends Map<string, { listeners: Listener[]; fired: boolean }>
 */
class Events extends Map<string, { listeners: Listener[]; fired: boolean }> {
  /** The registry that holds the plugins. */
  private registry: Registry;

  /**
   * Creates a new Events instance.
   *
   * @param registry - The registry that manages plugins.
   */
  constructor(registry: Registry) {
    super();
    this.registry = registry;
  }

  /**
   * Holds conditional triggers that are waiting for multiple events.
   * The key is built from the condition type and sorted event names.
   */
  private conditionalTriggers = new Map<string, ConditionalTrigger>();

  /**
   * Emits an event with the given name.
   *
   * If the event has already been fired, it logs a message and does nothing.
   * Otherwise, it executes all the listeners associated with the event, marks the
   * event as fired, and then checks if any conditional triggers' conditions are now met.
   *
   * @param event - The name of the event to emit.
   */
  emit(event: string): void {
    // Retrieve the current event state or initialize if not present.
    const target = this.get(event) ?? { listeners: [], fired: false };

    // If event already fired, log and exit.
    if (target.fired) {
      console.debug(`Event '${event}' already emitted. Skipping.`);
      return;
    }

    console.debug(`Emitting event: ${event}`);

    // Execute all listeners associated with this event.
    target.listeners.forEach((listener) => listener(this.registry.plugins));

    // Mark event as fired in the map.
    this.set(event, { ...target, fired: true });

    // Check if this event firing satisfies any conditional trigger.
    this.checkConditionalTriggers();
  }

  /**
   * Registers a trigger to be executed based on specific events and conditions.
   *
   * For a 'single' condition, it attaches the listener directly to the specified event.
   * For 'any' or 'all' conditions, it stores the trigger for later checking.
   *
   * @param trigger - The conditional trigger configuration.
   * @returns The current instance of Events for chaining.
   * @throws {Error} If 'single' condition doesn't receive exactly one event name.
   * @throws {Error} If the condition type is unknown.
   */
  on(trigger: ConditionalTrigger): this {
    const { condition, events, listener } = trigger;
    switch (condition) {
      case "single": {
        // Validate that only one event is provided for "single" condition.
        if (events.length !== 1) {
          throw new Error(
            `'single' condition requires exactly one event name. Received: ${events}`,
          );
        }
        // Attach listener to the event.
        const target = this.get(events[0]) ?? { listeners: [], fired: false };
        target.listeners.push(listener);
        this.set(events[0], target);
        break;
      }
      case "any":
      case "all": {
        // Build a unique key for the conditional trigger and store it.
        const key = buildConditionalKey(condition, events);
        this.conditionalTriggers.set(key, trigger);
        break;
      }
      default:
        // If an unknown condition is provided, throw an error.
        throw new Error(`Unknown condition type: ${condition}`);
    }
    // Check if the new trigger can be immediately satisfied by already fired events.
    this.checkConditionalTriggers();
    return this;
  }

  /**
   * Checks all stored conditional triggers to see if their conditions have been met.
   *
   * For 'all' condition, it verifies that every associated event has been fired.
   * For 'any' condition, it verifies that at least one associated event has been fired.
   *
   * When a trigger's condition is met, its listener is executed and the trigger is removed.
   */
  private checkConditionalTriggers(): void {
    for (
      const [key, { condition, events, listener }] of this.conditionalTriggers
    ) {
      let shouldTrigger = false;
      switch (condition) {
        case "all":
          // Check if every event in the array has been fired.
          shouldTrigger = events.every((ev) => this.get(ev)?.fired);
          break;
        case "any":
          // Check if at least one event in the array has been fired.
          shouldTrigger = events.some((ev) => this.get(ev)?.fired);
          break;
      }
      // If the condition is met, execute the listener and remove the trigger.
      if (shouldTrigger) {
        listener(this.registry.plugins);
        this.conditionalTriggers.delete(key);
      }
    }
  }
}

/**
 * Builds a unique key for conditional triggers based on the condition type and events.
 *
 * The events are sorted alphabetically to ensure consistent key generation.
 *
 * @param condition - The condition type ("any" or "all").
 * @param events - The array of event names.
 * @returns A string key representing the conditional trigger.
 */
const buildConditionalKey = (
  condition: "any" | "all",
  events: string[],
): string => {
  const sortedEvents = [...events].sort();
  return `${condition}:${sortedEvents.join(",")}`;
};

/**
 * Represents the structure of a Plugin.
 *
 * A Plugin must have a unique name and can optionally have register and initialize methods.
 */
export type Plugin = {
  /** The unique name of the plugin. */
  name: string;
  /**
   * Optional method to register the plugin.
   * This receives the Events instance to allow the plugin to subscribe to events.
   *
   * @param events - The Events instance from the Registry.
   */
  register?(events: Events): void;
  /**
   * Optional method to initialize the plugin.
   */
  initialize?(): void;
};

/**
 * The Registry class manages plugin registration and initialization,
 * and coordinates events related to plugin lifecycle.
 */
export class Registry {
  /** Internal collection of plugins, stored as a map keyed by plugin name. */
  private _plugins = new Map<string, Plugin>();

  /**
   * The Events instance used for emitting and handling events for plugins.
   *
   * It is constructed with a reference to this Registry instance.
   */
  private events = new Events(this);

  /**
   * Getter to access the internal collection of plugins.
   *
   * @returns The map of registered plugins.
   */
  get plugins(): typeof this._plugins {
    return this._plugins;
  }

  /**
   * Creates a new Registry instance.
   *
   * Optionally registers an initial array of plugins, then emits core events indicating
   * the state of plugin registration and initialization.
   *
   * The flow is:
   * 1. Register provided plugins.
   * 2. Emit "core.registered" and "core.initializing" events.
   * 3. Initialize all plugins.
   * 4. Emit "core.initialized" event.
   *
   * @param plugins - An optional array of plugins to register initially.
   */
  constructor(plugins: Plugin[] = []) {
    plugins.forEach((plugin) => this.register(plugin));

    // Emit core events to mark various stages of plugin lifecycle.
    this.events.emit("core.registered");
    this.events.emit("core.initializing");

    this.initialize();

    this.events.emit("core.initialized");
  }

  /**
   * Registers a plugin with the registry.
   *
   * It ensures that each plugin has a unique name, emits events before and after registration,
   * and calls the plugin's optional register method.
   *
   * @param plugin - The plugin object to register.
   * @throws {Error} If a plugin with the same name is already registered.
   */
  private register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(
        `Plugin with name '${plugin.name}' is already registered.`,
      );
    }

    // Register the plugin.
    this.plugins.set(plugin.name, plugin);

    // Call the plugin's register function if provided.
    plugin.register?.(this.events);
  }

  /**
   * Initializes all registered plugins.
   *
   * For every plugin with an initialize method, it emits events before and after
   * initialization and calls the initialize method.
   */
  private initialize(): void {
    for (const plugin of this._plugins.values()) {
      // If the plugin has an initialize function, perform initialization steps.
      if (plugin.initialize) {
        this.events.emit(`plugin.${plugin.name}.initializing`);
        plugin.initialize();
      }
      // Emit an event indicating that the plugin has been initialized.
      this.events.emit(`plugin.${plugin.name}.initialized`);
    }
  }
}
