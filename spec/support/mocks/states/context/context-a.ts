import { inject, injectable } from "inversify";
import { TranslateHelper } from "../../../../../src/components/i18n/public-interfaces";
import { Logger } from "../../../../../src/components/root/public-interfaces";
import { BaseState } from "../../../../../src/components/state-machine/base-state";
import { stayInContext } from "../../../../../src/components/state-machine/decorators/context";
import { State, Transitionable } from "../../../../../src/components/state-machine/public-interfaces";
import { injectionNames } from "../../../../../src/injection-names";
import { testCallback } from "../../../util/context-test-callback";
import { MockHandlerA, MockHandlerASpecificTypes } from "../../unifier/response-handler/mock-handler-a";

@stayInContext(testCallback)
@injectable()
export class ContextAState extends BaseState<MockHandlerASpecificTypes, MockHandlerA<MockHandlerASpecificTypes>> implements State.Required {
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

  public async exampleAIntent(machine: Transitionable) {
    // do something
  }
}
