export const componentInterfaces = {
  state: Symbol("state"),
  metaState: Symbol("meta state"),

  // Hooks
  beforeIntent: Symbol("before-intent-hook"),
  afterIntent: Symbol("after-intent-hook"),

  // Before/After StateMachine
  beforeStateMachine: Symbol("before-state-machine"),
  afterStateMachine: Symbol("after-state-machine"),
};
