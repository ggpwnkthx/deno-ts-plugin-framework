// ./mod.ts
type Listener<TArgs extends unknown[] = unknown[]> = (...args: TArgs) => void;

export class Events extends Map<string, Listener<any[]>[]> {
  on<TArgs extends unknown[] = unknown[]>(
    event: string,
    listener: Listener<TArgs>,
  ): this {
    if (!this.has(event)) {
      this.set(event, []);
    }
    this.get(event)!.push(listener);
    return this;
  }

  emit<TArgs extends unknown[]>(event: string, ...args: TArgs): void {
    console.debug(`Emitting event: ${event}`);
    this.get(event)?.forEach((listener) => listener(...args));
  }
}

export interface Plugin {
  name: string;
  register?(events: Events): void;
  initialize?(): void;
}

export class Registry {
  private plugins = new Map<string, Plugin>();
  private events = new Events();

  constructor(plugins: Plugin[] = []) {
    plugins.forEach((plugin) => this.register(plugin));
    this.events.emit("core.registered", plugins);
    this.events.emit("core.initializing", this.plugins);
    this.initialize();
    this.events.emit("core.initialized", this.plugins);
  }

  private register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(
        `Plugin with name '${plugin.name}' is already registered.`,
      );
    }
    this.events.emit(`plugin.${plugin.name}.registering`);
    this.plugins.set(plugin.name, plugin);
    plugin.register?.(this.events);
    this.events.emit(`plugin.${plugin.name}.registered`);
  }

  private initialize(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.initialize) {
        this.events.emit(`plugin.${plugin.name}.initializing`, plugin);
        plugin.initialize?.();
        this.events.emit(`plugin.${plugin.name}.initialized`, plugin);
      }
    }
  }
}
