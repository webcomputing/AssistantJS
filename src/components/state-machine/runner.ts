import { inject, injectable, optional } from "inversify";
import { ExecutableExtension } from "inversify-components";
import { MinimalRequestExtraction } from "../unifier/public-interfaces";

import { StateMachine } from "./state-machine";

@injectable()
export class Runner implements ExecutableExtension {
  public extraction?: MinimalRequestExtraction;
  public machine: StateMachine;

  constructor(
    @inject("core:unifier:current-extraction")
    @optional()
    extraction: any,
    @inject("core:state-machine:current-state-machine") machine: StateMachine
  ) {
    this.extraction = extraction;
    this.machine = machine;
  }

  public execute() {
    // Only start state machine if there is an extraction result
    if (typeof this.extraction !== "undefined") {
      this.machine.handleIntent(this.extraction.intent);
    }
  }
}
