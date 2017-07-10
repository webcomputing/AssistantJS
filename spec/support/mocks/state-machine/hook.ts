import { Hooks, Container } from "inversify-components";
import { componentInterfaces } from "../../../../src/components/state-machine/interfaces";

/** Hook wich calls failure function if called intent is "test" */
export const TestIntentFilterHook: Hooks.Hook = (success, failure, mode, state, stateName, intent, machine) => {
  if (intent === "testIntent") failure();
  else success();
}

/** Creates a hook which calls given function with called intent */
export function createSpyHook(spyFunction: Function): Hooks.Hook {
  return (success, failure, mode, state, stateName, intent, machine) => {
    spyFunction(intent, stateName, state, mode, machine, success, failure);
    success();
  }
}

/**
 * Binds a hook to container
 * @param container Container to bind to
 * @param beforeIntent If set to true, binds to beforeIntent, else to afterIntent
 * @param hook Hook to bind
 */
export function registerHook(container: Container, beforeIntent = true, hook = TestIntentFilterHook) {
  let binding = beforeIntent ? componentInterfaces.beforeIntent : componentInterfaces.afterIntent;
  container.inversifyInstance.bind(binding).toFunction(hook);
}