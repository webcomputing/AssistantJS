import { inject, injectable, optional } from "inversify";
import { TranslateHelper } from "../../../../src/components/i18n/public-interfaces";
import { Logger } from "../../../../src/components/root/public-interfaces";
import { BaseState } from "../../../../src/components/state-machine/base-state";
import { filter } from "../../../../src/components/state-machine/filter-decorator";
import { State } from "../../../../src/components/state-machine/public-interfaces";
import { BasicHandable } from "../../../../src/components/unifier/response-handler";
import { injectionNames } from "../../../../src/injection-names";
import { TestFilterB } from "../filters/test-filter-b";
import { TestFilterC } from "../filters/test-filter-c";
import { MockHandlerA, MockHandlerASpecificTypes } from "../unifier/response-handler/mock-handler-a";

@injectable()
export class FilterCState extends BaseState<MockHandlerASpecificTypes, MockHandlerA<MockHandlerASpecificTypes>> implements State.Required {
  public extraction: any;

  constructor(
    @inject(injectionNames.current.responseHandler) responseHandler: MockHandlerA<MockHandlerASpecificTypes>,
    @inject("core:unifier:current-extraction") extraction: any,
    @inject("core:i18n:current-translate-helper") translateHelper: TranslateHelper,
    @inject("core:root:current-logger") logger: Logger
  ) {
    super(responseHandler, translateHelper, extraction, logger);
    this.extraction = extraction;
  }

  @filter(TestFilterC)
  public filterTestAIntent(...args: any[]) {
    this.responseHandler.endSessionWith(this.t("filter.stateC.intentA")).send();
  }

  public filterTestBIntent() {
    this.responseHandler.endSessionWith(this.t("filter.stateC.intentB")).send();
  }

  @filter(TestFilterB)
  public filterTestArgumentsPassingIntent() {
    // never called
  }
}
