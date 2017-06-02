import { ExecutableExtension } from "ioc-container";
import { inject, injectable, optional } from "inversify";
import { ConversationContext } from "../unifier/interfaces";

import { StateMachine } from "./interfaces";

@injectable()
export class Runner implements ExecutableExtension {
  extraction: any;

  constructor(@inject("current|core:unifier:current-extraction") @optional() extraction: any) {
    this.extraction = extraction;
  }

  execute() {
    // Only start state machine if there is an extraction result
    if (typeof this.extraction !== "undefined") {
      // TODO
    }
  }
}