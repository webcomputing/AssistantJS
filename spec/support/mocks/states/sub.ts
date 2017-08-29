import { State } from "../../../../src/components/state-machine/interfaces";
import { ResponseFactory } from "../../../../src/components/unifier/interfaces";
import { optional, inject, injectable } from "inversify";

import { MainState } from "./main";

@injectable()
export class SubState extends MainState {

  constructor(
    @inject("core:unifier:current-response-factory") responseFactory: ResponseFactory,
    @inject("core:unifier:current-extraction") extraction: any,
    @inject("core:i18n:current-translate-helper") tHelper: any,
    @optional() @inject("mocks:states:call-spy") spy: Function
  ) {
    super(responseFactory, extraction, tHelper, spy);
  }

  helpGenericIntent(...args: any[]) {
    this.spyIfExistent("help", ...args);
  }
}