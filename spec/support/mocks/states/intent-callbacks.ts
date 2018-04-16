import { inject, injectable, optional } from "inversify";
import { BaseState } from "../../../../src/components/state-machine/base-state";
import { State } from "../../../../src/components/state-machine/public-interfaces";
import { injectionNames } from "../../../../src/injection-names";

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

  public beforeIntent_(intent, machine, ...args) {
    this.spyIfExistent("beforeIntent_", intent, machine, ...args);

    // beforeIntents are only allowed to return boolean values
    if (intent === "illegalIntent") return {} as boolean;

    // returns true if called intent is "okayIntent"
    return intent === "okayIntent";
  }

  public illegalIntent() {
    this.spyIfExistent("illegalIntent");
  }

  public okayIntent() {
    this.spyIfExistent("okayIntent");
  }

  public notOkayIntent() {
    this.spyIfExistent("notOkayIntent");
  }

  public afterIntent_(intent, machine, ...args) {
    this.spyIfExistent("afterIntent_", intent, machine, ...args);
  }

  protected spyIfExistent(methodName: string, ...args: any[]) {
    if (typeof this.spy !== "undefined") {
      this.spy(this, methodName, ...args);
    }
  }
}
