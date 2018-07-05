export const componentInterfaces = {
  state: Symbol("state"),
  metaState: Symbol("meta state"),
  filter: Symbol("filter"),

  // Hooks
  beforeIntent: Symbol("before-intent-hook"),
  afterIntent: Symbol("after-intent-hook"),

  // Before/After StateMachine
  beforeStateMachine: Symbol("before-state-machine"),
  afterStateMachine: Symbol("after-state-machine"),
};

export const COMPONENT_NAME = "core:state-machine";
