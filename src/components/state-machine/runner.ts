import { inject, injectable, multiInject, optional } from "inversify";
import { injectionNames } from "../../injection-names";
import { MinimalRequestExtraction } from "../unifier/public-interfaces";
import { componentInterfaces } from "./private-interfaces";
import { AfterContextExtension, AfterStateMachine, BeforeStateMachine } from "./public-interfaces";
import { StateMachine } from "./state-machine";

@injectable()
export class Runner implements AfterContextExtension {
  constructor(
    @inject(injectionNames.current.extraction)
    @optional()
    public extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.stateMachine) private machine: StateMachine,
    @optional()
    @multiInject(componentInterfaces.beforeStateMachine)
    private beforeStatemachineExtensions: BeforeStateMachine[],
    @optional()
    @multiInject(componentInterfaces.afterStateMachine)
    private afterStatemachineExtensions: AfterStateMachine[]
  ) {}

  public async execute(...args: any[]) {
    // Only start state machine if there is an extraction result
    if (typeof this.extraction !== "undefined") {
      // call all before state machine extensions
      await Promise.all(this.beforeStatemachineExtensions.map(ex => ex.execute()));

      // call state machine
      await this.machine.handleIntent(this.extraction.intent, ...args);

      // call all after state machine extensions
      await Promise.all(this.afterStatemachineExtensions.map(ex => ex.execute()));
    }
  }
}
