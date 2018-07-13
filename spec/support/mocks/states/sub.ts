import { inject, injectable, optional } from "inversify";
import { Logger } from "../../../../src/components/root/public-interfaces";

import { BasicHandler } from "../../../../src/assistant-source";
import { injectionNames } from "../../../../src/injection-names";
import { MainState } from "./main";

@injectable()
export class SubState extends MainState {
  constructor(
    @inject(injectionNames.current.responseHandler) responseHandler: BasicHandler<any>,
    @inject("core:unifier:current-extraction") extraction: any,
    @inject("core:i18n:current-translate-helper") tHelper: any,
    @inject("core:root:current-logger") logger: Logger,
    @optional()
    @inject("mocks:states:call-spy")
    spy: (...args: any[]) => void
  ) {
    super(responseHandler, extraction, tHelper, logger, spy);
  }

  public helpGenericIntent(...args: any[]) {
    this.spyIfExistent("help", ...args);
  }
}
