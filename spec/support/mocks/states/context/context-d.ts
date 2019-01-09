import { inject, injectable, optional } from "inversify";
import { BasicHandable } from "../../../../../src/assistant-source";
import { TranslateHelper } from "../../../../../src/components/i18n/public-interfaces";
import { Logger } from "../../../../../src/components/root/public-interfaces";
import { BaseState } from "../../../../../src/components/state-machine/base-state";
import { clearContext } from "../../../../../src/components/state-machine/decorators/clear-context-decorator";
import { stayInContext } from "../../../../../src/components/state-machine/decorators/stay-in-context-decorator";
import { State, Transitionable } from "../../../../../src/components/state-machine/public-interfaces";
import { injectionNames } from "../../../../../src/injection-names";
import { MockHandlerA, MockHandlerASpecificTypes } from "../../unifier/response-handler/mock-handler-a";

@stayInContext()
@clearContext(() => false)
@injectable()
export class ContextDState extends BaseState<MockHandlerASpecificTypes, MockHandlerA<MockHandlerASpecificTypes>> implements State.Required {
  public extraction: any;

  constructor(
    @inject(injectionNames.current.responseHandler) responseHandler: MockHandlerA<MockHandlerASpecificTypes>,
    @inject(injectionNames.current.extraction) extraction: any,
    @inject(injectionNames.current.translateHelper) translateHelper: TranslateHelper,
    @inject(injectionNames.current.logger) logger: Logger
  ) {
    super(responseHandler, translateHelper, extraction, logger);
    this.extraction = extraction;
  }

  public async exampleDIntent(machine: Transitionable) {
    // do something
  }
}
