import { describe, it, beforeAll } from "jsr:@std/testing/bdd";
import { spy, assertSpyCalls } from "jsr:@std/testing/mock";
import { Events, Registry, type Plugin } from "./mod.ts";

describe("Plugin Framework Tests", () => {
  describe("Events", () => {
    it("should register and emit events", () => {
      const events = new Events();
      const listenerSpy = spy();

      events.on("test:event", listenerSpy);
      events.emit("test:event", "Hello, World!");

      assertSpyCalls(listenerSpy, 1);
    });
  });

  describe("Registry", () => {
    let mockPlugin: Plugin;
    let registry: Registry;

    beforeAll(() => {
      mockPlugin = {
        name: "mockPlugin",
        register(events) {
          events.on("mock:event", () => {});
        },
        initialize() {},
      };
      registry = new Registry([mockPlugin]);
    });

    it("should register plugins", () => {
      const registeredPlugins = Array.from(registry["plugins"].keys());
      if (!registeredPlugins.includes("mockPlugin")) {
        throw new Error("mockPlugin not registered.");
      }
    });

    it("should throw error for duplicate plugin registration", () => {
      try {
        registry["register"](mockPlugin);
        throw new Error("Duplicate registration did not throw.");
      } catch (e) {
        if (e instanceof Error && e.message.includes("already registered")) {
          // Expected error, test passes.
          return;
        }
        throw e; // Re-throw unexpected errors.
      }
    });
    

    it("should call plugin lifecycle hooks", () => {
      const registerSpy = spy(mockPlugin, "register");
      const initializeSpy = spy(mockPlugin, "initialize");

      new Registry([mockPlugin]);

      assertSpyCalls(registerSpy, 1);
      assertSpyCalls(initializeSpy, 1);

      registerSpy.restore();
      initializeSpy.restore();
    });

    it("should handle event-driven plugin behavior", () => {
      const eventSpy = spy();
      const plugin: Plugin = {
        name: "eventPlugin",
        register(events) {
          events.on("custom:event", eventSpy);
        },
      };

      const eventRegistry = new Registry([plugin]);
      eventRegistry["events"].emit("custom:event", "Test Event");

      assertSpyCalls(eventSpy, 1);
    });
  });
});
