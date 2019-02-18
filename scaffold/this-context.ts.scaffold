import { PlatformSpecHelper, SpecHelper, SpecHelperOptions } from "assistant-source";
import { interfaces as inversifyInterfaces } from "inversify";
import { ApplicationInitializer } from "../../application-initializer";
import { MergedAnswerTypes, MergedHandler } from "../../config/handler";

/** Use this context to describe your "this" in jasmine specs */
export interface ThisContext {
  /** AssistantJS's spec helper, enables you to execute the state machine, prepare intent calls, and so on */
  specHelper: SpecHelper;

  /** References our ./application-initializer, useful for starting servers etc. */
  applicationInitializer: ApplicationInitializer;

  /** References different setup instances, equals the return of our ApplicationInitializer.createAndPrepareSetups method */
  setups: ReturnType<ApplicationInitializer["createAndPrepareSetups"]>;

  /** References our inversify container instance for easy dependency injection mocking. Abbrevation for setups.assistantJs.container.inversifyInstance */
  inversify: inversifyInterfaces.Container;

  /** References a platform spec helper for every platform you'd like to use. Use this as the first parameter for this.specHelper.prepareIntentCall() */
  platforms: { [platformName: string]: PlatformSpecHelper<MergedAnswerTypes, MergedHandler> };

  /** Default spec options to pass into specHelper.prepareSpec(). You might want to override some options per spec. */
  defaultSpecOptions: Partial<SpecHelperOptions>;

  /** Result of current intent call. Usage: this.responseResults = this.specHelper.runMachineAndGetResults(stateName) */
  responseResults: Partial<MergedAnswerTypes>;

  /** Use this for any untyped test params */
  params: any;
}
