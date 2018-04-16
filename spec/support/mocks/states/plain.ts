import { inject, injectable, optional } from "inversify";
import { BaseState } from "../../../../src/components/state-machine/base-state";
import { State } from "../../../../src/components/state-machine/public-interfaces";
import { injectionNames } from "../../../../src/injection-names";

/** Just a plain state to test the BaseState easily */

@injectable()
export class PlainState extends BaseState {
  constructor(@inject(injectionNames.current.stateSetupSet) stateSetupSet: State.SetupSet) {
    super(stateSetupSet);
  }
}
