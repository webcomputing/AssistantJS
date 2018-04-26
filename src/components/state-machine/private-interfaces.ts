export const componentInterfaces = {
  state: Symbol("state"),
  metaState: Symbol("meta state"),
  filter: Symbol("filter"),

  // Hooks
  beforeIntent: Symbol("before-intent-hook"),
  afterIntent: Symbol("after-intent-hook"),
};

export const COMPONENT_NAME = "state-machine";
