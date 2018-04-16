import { injectionNames } from "../../../../src/injection-names";
import { BaseState } from "../../../../src/components/state-machine/base-state";
import { injectable, inject, optional } from "inversify";
import { State } from "../../../../src/components/state-machine/public-interfaces";

/** Just a plain state to test the BaseState easily */

@injectable()
export class IntentCallbackState extends BaseState implements State.AfterIntent, State.BeforeIntent {
  constructor(
    @inject(injectionNames.current.stateSetupSet) stateSetupSet: State.SetupSet,
    @optional()
    @inject("mocks:states:call-spy")
    private spy: Function
  ) {
    super(stateSetupSet);
  }

  beforeIntent_(intent, machine, ...args) {
    this.spyIfExistent("beforeIntent_", intent, machine, ...args);

    // beforeIntents are only allowed to return boolean values
    if (intent === "illegalIntent") return {} as boolean;

    // returns true if called intent is "okayIntent"
    return intent === "okayIntent";
  }

  illegalIntent() {
    this.spyIfExistent("illegalIntent");
  }

  okayIntent() {
    this.spyIfExistent("okayIntent");
  }

  notOkayIntent() {
    this.spyIfExistent("notOkayIntent");
  }

  afterIntent_(intent, machine, ...args) {
    this.spyIfExistent("afterIntent_", intent, machine, ...args);
  }

  protected spyIfExistent(methodName: string, ...args: any[]) {
    if (typeof this.spy !== "undefined") {
      this.spy(this, methodName, ...args);
    }
  }
}
