import { State } from "../../../../src/components/state-machine/interfaces";
import { optional, inject, injectable } from "inversify";

import { MainState } from "./main";

@injectable()
export class SubState extends MainState {

  constructor(@optional() @inject("mocks:states:call-spy") spy: Function) {
    super(spy);
  }

  helpGenericIntent(...args: any[]) {
    this.spyIfExistent("help", ...args);
  }
}