import { inject, injectable, optional } from "inversify";
import { TranslateHelper } from "../../../../../src/components/i18n/public-interfaces";
import { Logger } from "../../../../../src/components/root/public-interfaces";
import { BaseState } from "../../../../../src/components/state-machine/base-state";
import { clearContext } from "../../../../../src/components/state-machine/clear-context-decorator";
import { State, Transitionable } from "../../../../../src/components/state-machine/public-interfaces";
import { stayInContext } from "../../../../../src/components/state-machine/stay-in-context-decorator";
import { ResponseFactory } from "../../../../../src/components/unifier/public-interfaces";

@stayInContext()
@clearContext(() => false)
@injectable()
export class ContextDState extends BaseState implements State.Required {
  public responseFactory: ResponseFactory;
  public extraction: any;

  constructor(
    @inject("core:unifier:current-response-factory") responseFactory: ResponseFactory,
    @inject("core:unifier:current-extraction") extraction: any,
    @inject("core:i18n:current-translate-helper") translateHelper: TranslateHelper,
    @inject("core:root:current-logger") logger: Logger
  ) {
    super(responseFactory, translateHelper, extraction, logger);
    this.extraction = extraction;
    this.responseFactory = responseFactory;
  }

  public async exampleDIntent(machine: Transitionable) {
    // do something
  }
}
