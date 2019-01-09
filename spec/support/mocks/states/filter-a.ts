import { inject, injectable, optional } from "inversify";
import { BasicHandable } from "../../../../src/assistant-source";
import { TranslateHelper } from "../../../../src/components/i18n/public-interfaces";
import { Logger } from "../../../../src/components/root/public-interfaces";
import { BaseState } from "../../../../src/components/state-machine/base-state";
import { filter } from "../../../../src/components/state-machine/filter-decorator";
import { State } from "../../../../src/components/state-machine/public-interfaces";
import { injectionNames } from "../../../../src/injection-names";
import { TestFilterA } from "../filters/test-filter-a";
import { TestFilterB } from "../filters/test-filter-b";
import { TestFilterD } from "../filters/test-filter-d";
import { MockHandlerA, MockHandlerASpecificTypes } from "../unifier/response-handler/mock-handler-a";

@injectable()
export class FilterAState extends BaseState<MockHandlerASpecificTypes, MockHandlerA<MockHandlerASpecificTypes>> implements State.Required {
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

  @filter(TestFilterA)
  public async filterTestAIntent(...args: any[]) {
    await this.responseHandler.endSessionWith(this.t("filter.stateA.intentA")).send();
  }

  public async filterTestBIntent() {
    await this.responseHandler.endSessionWith(this.t("filter.stateA.intentB")).send();
  }

  @filter(TestFilterD, TestFilterA)
  public async filterTestCIntent() {
    await this.responseHandler.endSessionWith(this.t("filter.stateA.intentC")).send();
  }

  @filter(TestFilterA, TestFilterB)
  public async filterTestDIntent() {
    await this.responseHandler.endSessionWith(this.t("filter.stateA.intentD")).send();
  }

  @filter({ filter: TestFilterA, params: { exampleParam: "example" } })
  public async filterTestEIntent() {
    await this.responseHandler.endSessionWith(this.t("filter.stateA.intentE")).send();
  }
}
