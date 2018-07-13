import { inject, injectable, optional } from "inversify";
import { BasicHandler } from "../../../../../src/assistant-source";
import { TranslateHelper } from "../../../../../src/components/i18n/public-interfaces";
import { Logger } from "../../../../../src/components/root/public-interfaces";
import { BaseState } from "../../../../../src/components/state-machine/base-state";
import { clearContext } from "../../../../../src/components/state-machine/decorators/clear-context-decorator";
import { stayInContext } from "../../../../../src/components/state-machine/decorators/stay-in-context-decorator";
import { State, Transitionable } from "../../../../../src/components/state-machine/public-interfaces";
import { injectionNames } from "../../../../../src/injection-names";
import { testCallback } from "../../../../components/state-machine/context.spec";

@stayInContext()
@clearContext(testCallback)
@injectable()
export class ContextCState extends BaseState implements State.Required {
  public extraction: any;

  constructor(
    @inject(injectionNames.current.responseHandler) responseHandler: BasicHandler<any>,
    @inject("core:unifier:current-extraction") extraction: any,
    @inject("core:i18n:current-translate-helper") translateHelper: TranslateHelper,
    @inject("core:root:current-logger") logger: Logger
  ) {
    super(responseHandler, translateHelper, extraction, logger);
    this.extraction = extraction;
  }

  public async exampleCIntent(machine: Transitionable) {
    // do something
  }
}
