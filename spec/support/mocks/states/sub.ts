import { State } from "../../../../src/components/state-machine/interfaces";
import { injectable } from "inversify";

import { MainState } from "./main";

@injectable()
export class SubState extends MainState {
  helpGenericIntent() {

  }
}