import {injectionNames} from '../../../../src/injection-names';
import { BaseState } from '../../../../src/components/state-machine/base-state';
import { injectable, inject, optional } from "inversify";
import { StateSetupSet } from "../../../../src/components/state-machine/interfaces";

/** Just a plain state to test the BaseState easily */

@injectable()
export class PlainState extends BaseState {
  constructor(@inject(injectionNames.current.stateSetupSet) stateSetupSet: StateSetupSet) {
    super(stateSetupSet);
  }
}