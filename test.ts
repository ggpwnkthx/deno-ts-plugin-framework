import { beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { assertSpyCalls, spy } from "jsr:@std/testing/mock";
import { type Plugin, Registry } from "./mod.ts";

describe("Events and Registry", () => {
  let registry: Registry;

  beforeAll(() => {
    // Initialize a new Registry before running tests.
    registry = new Registry();
  });

  describe("Registry Initialization", () => {
    it("should initialize with no plugins by default", () => {
      const plugins = registry.plugins;
      if (plugins.size !== 0) {
        throw new Error("Expected no plugins in the registry.");
      }
    });

    it("should emit core lifecycle events during initialization", () => {
      const eventSpy = spy();
      const mockPlugin: Plugin = {
        name: "test-plugin",
        register(events) {
          events.on({
            condition: "single",
            events: ["core.initialized"],
            listener: eventSpy,
          });
        },
      };

      new Registry([mockPlugin]); // Create a new Registry instance to trigger events.
      assertSpyCalls(eventSpy, 1);
    });
  });

  describe("Event Emission", () => {
    it("should fire a single event and call its listeners", () => {
      const eventSpy = spy();
      const events = new (registry as any).events.constructor(registry);

      events.on({
        condition: "single",
        events: ["event1"],
        listener: eventSpy,
      });

      events.emit("event1");
      assertSpyCalls(eventSpy, 1);
    });

    it("should skip emitting an event that has already been fired", () => {
      const eventSpy = spy();
      const events = new (registry as any).events.constructor(registry);

      events.on({
        condition: "single",
        events: ["event1"],
        listener: eventSpy,
      });

      events.emit("event1");
      events.emit("event1"); // Emit again; should not trigger listener.
      assertSpyCalls(eventSpy, 1);
    });
  });

  describe("Conditional Triggers", () => {
    it("should fire a 'single' condition event", () => {
      const listenerSpy = spy();
      const events = new (registry as any).events.constructor(registry);

      events.on({
        condition: "single",
        events: ["event1"],
        listener: listenerSpy,
      });

      events.emit("event1");
      assertSpyCalls(listenerSpy, 1);
    });

    it("should fire an 'any' condition when one of the events is emitted", () => {
      const listenerSpy = spy();
      const events = new (registry as any).events.constructor(registry);

      events.on({
        condition: "any",
        events: ["event1", "event2"],
        listener: listenerSpy,
      });

      events.emit("event2");
      assertSpyCalls(listenerSpy, 1);
    });

    it("should fire an 'all' condition when all events are emitted", () => {
      const listenerSpy = spy();
      const events = new (registry as any).events.constructor(registry);

      events.on({
        condition: "all",
        events: ["event1", "event2"],
        listener: listenerSpy,
      });

      events.emit("event1");
      events.emit("event2");
      assertSpyCalls(listenerSpy, 1);
    });

    it("should not fire an 'all' condition if not all events are emitted", () => {
      const listenerSpy = spy();
      const events = new (registry as any).events.constructor(registry);

      events.on({
        condition: "all",
        events: ["event1", "event2"],
        listener: listenerSpy,
      });

      events.emit("event1");
      assertSpyCalls(listenerSpy, 0); // Should not be triggered yet.
    });
  });

  describe("Plugin Management", () => {
    it("should register a plugin successfully", () => {
      const plugin: Plugin = {
        name: "test-plugin",
      };

      registry = new Registry([plugin]); // Reinitialize Registry with the plugin.

      if (!registry.plugins.has("test-plugin")) {
        throw new Error("Plugin was not registered successfully.");
      }
    });

    it("should throw an error when registering a duplicate plugin", () => {
      const plugin: Plugin = {
        name: "duplicate-plugin",
      };

      try {
        registry = new Registry([plugin, plugin]);
        throw new Error("Expected an error for duplicate plugin registration.");
      } catch (e) {
        if (e instanceof Error) {
          const expectedMessage =
            `Plugin with name '${plugin.name}' is already registered.`;
          if (e.message !== expectedMessage) {
            throw new Error(`Unexpected error message: ${e.message}`);
          }
        } else {
          throw new Error("Caught an unknown error.");
        }
      }
    });
  });
});
