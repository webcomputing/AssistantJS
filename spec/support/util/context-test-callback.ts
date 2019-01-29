import { State } from "../../../src/assistant-source";

export let currentStateName: string | undefined;
export let currentStateInstance: State.Required | undefined;
export let contextStateNames: string[] | undefined;
export let intentHistory: Array<{ stateName: string; intentMethodName: string }> | undefined;
export let stateNameToTransitionTo: string | undefined;

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
