import { Container, Hooks } from "inversify-components";
import { componentInterfaces } from "../../../../src/components/state-machine/private-interfaces";

/** Hook wich returns a unsuccessful result if called intent is "test" */
export const TestIntentFilterHook: Hooks.Hook = (mode, state, stateName, intent, machine) => {
  if (intent === "testIntent") return false;
  else return true;
};

/** Creates a hook which calls given function with called intent */
export function createSpyHook(spyFunction: Function): Hooks.Hook {
  return (mode, state, stateName, intent, machine, ...args) => {
    spyFunction(intent, stateName, state, mode, machine, ...args);
    return true;
  };
}

/**
 * Binds a hook to container
 * @param container Container to bind to
 * @param beforeIntent If set to true, binds to beforeIntent, else to afterIntent
 * @param hook Hook to bind
 */
export function registerHook(container: Container, beforeIntent = true, hook = TestIntentFilterHook) {
  const binding = beforeIntent ? componentInterfaces.beforeIntent : componentInterfaces.afterIntent;
  container.inversifyInstance.bind(binding).toFunction(hook);
}
