import { inject, injectable, optional } from "inversify";
import { Logger } from "../../../../src/components/root/public-interfaces";
import { State } from "../../../../src/components/state-machine/public-interfaces";
import { ResponseFactory } from "../../../../src/components/unifier/public-interfaces";

import { MainState } from "./main";

@injectable()
export class SubState extends MainState {
  constructor(
    @inject("core:unifier:current-response-factory") responseFactory: ResponseFactory,
    @inject("core:unifier:current-extraction") extraction: any,
    @inject("core:i18n:current-translate-helper") tHelper: any,
    @inject("core:root:current-logger") logger: Logger,
    @optional()
    @inject("mocks:states:call-spy")
    spy: Function
  ) {
    super(responseFactory, extraction, tHelper, logger, spy);
  }

  public helpGenericIntent(...args: any[]) {
    this.spyIfExistent("help", ...args);
  }
}
