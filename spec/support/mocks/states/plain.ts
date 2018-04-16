import { injectionNames } from "../../../../src/injection-names";
import { BaseState } from "../../../../src/components/state-machine/base-state";
import { injectable, inject, optional } from "inversify";
import { State } from "../../../../src/components/state-machine/public-interfaces";

/** Just a plain state to test the BaseState easily */

@injectable()
export class PlainState extends BaseState {
  constructor(@inject(injectionNames.current.stateSetupSet) stateSetupSet: State.SetupSet) {
    super(stateSetupSet);
  }
}
