import { State } from "../../../src/assistant-source";

export let currentStateName: string | undefined;
export let currentStateInstance: State.Required | undefined;
export let contextStateNames: string[] | undefined;
export let intentHistory: Array<{ stateName: string; intentMethodName: string }> | undefined;
export let stateNameToTransitionTo: string | undefined;

/**
 * Function that is passed as a mock callback to check callback execution for filter- and context decorators.
 * Passed values will be set to local variables to enable evaluation in specs.
 * Returns true.
 * @param currentStateNameParam name of a state
 * @param currentStateInstanceParam instance of a state
 * @param contextStateNamesParam names of context states
 * @param intentHistoryParam intent history
 * @param stateNameToTransitionToParam upcoming state to transition to
 */
export function testCallback(
  currentStateNameParam?: string,
  currentStateInstanceParam?: State.Required,
  contextStateNamesParam?: string[],
  intentHistoryParam?: Array<{ stateName: string; intentMethodName: string }>,
  stateNameToTransitionToParam?: string
) {
  currentStateName = currentStateNameParam;
  currentStateInstance = currentStateInstanceParam;
  contextStateNames = contextStateNamesParam;
  intentHistory = intentHistoryParam;
  stateNameToTransitionTo = stateNameToTransitionToParam;
  return true;
}
