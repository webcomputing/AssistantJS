import { ExecutableExtension } from "inversify-components";
import { inject, injectable, optional } from "inversify";
import { MinimalRequestExtraction } from "../unifier/interfaces";

import { StateMachine } from "./interfaces";

@injectable()
export class Runner implements ExecutableExtension {
  extraction?: MinimalRequestExtraction;
  machine: StateMachine;

  constructor(
    @inject("core:unifier:current-extraction") @optional() extraction: any,
    @inject("core:state-machine:current-state-machine") machine: StateMachine
  ) {
    this.extraction = extraction;
    this.machine = machine;
  }

  execute() {
    // Only start state machine if there is an extraction result
    if (typeof this.extraction !== "undefined") {
      this.machine.handleIntent(this.extraction.intent);
    }
  }
}