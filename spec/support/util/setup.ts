import { ContainerImpl } from "inversify-components";

import { RequestContext } from "../../../src/components/root/public-interfaces";
import { BasicHandable, MinimalRequestExtraction } from "../../../src/components/unifier/public-interfaces";
import { AssistantJSSetup } from "../../../src/setup";

import { SpecHelper } from "../../../src/spec-helper";

import { BasicAnswerTypes, BasicHandler, StateMachineSetup } from "../../../src/assistant-source";
import { TestFilterA } from "../mocks/filters/test-filter-a";
import { TestFilterB } from "../mocks/filters/test-filter-b";
import { TestFilterC } from "../mocks/filters/test-filter-c";
import { TestFilterD } from "../mocks/filters/test-filter-d";
import { context } from "../mocks/root/request-context";
import { ContextAState } from "../mocks/states/context/context-a";
import { ContextBState } from "../mocks/states/context/context-b";
import { ContextCState } from "../mocks/states/context/context-c";
import { ContextDState } from "../mocks/states/context/context-d";
import { FilterAState } from "../mocks/states/filter-a";
import { FilterBState } from "../mocks/states/filter-b";
import { FilterCState } from "../mocks/states/filter-c";
import { IntentCallbackState } from "../mocks/states/intent-callbacks";
import { MainState } from "../mocks/states/main";
import { PlainState } from "../mocks/states/plain";
import { SecondState } from "../mocks/states/second";
import { UnhandledErrorState } from "../mocks/states/unhandled-error";
import { UnhandledErrorWithFallbackState } from "../mocks/states/unhandled-error-with-fallback";
import { extraction } from "../mocks/unifier/extraction";
import { MockHandlerA as ResponseHandler } from "../mocks/unifier/response-handler/mock-handler-a";

/**
 * Creates a test assistant js setup
 * @param useMockStates If set to true, mock states (see mock/states -> Main and Second) will be added to setup
 * @param useChilds If set to true, child container for requests will be used, else mock/ChildlessGenericRequestHandler will be applied
 * @param autoBind If set to true, assistantJs.autobind() will be called for you
 * @param autoSetup If set to true, assistantJs.registerInternalComponents() will be called for you
 */
export function createSpecHelper(useMockStates = true, useChilds = false, autoBind = true, autoSetup = true): SpecHelper {
  const assistantJs = new AssistantJSSetup(new ContainerImpl());
  const specHelper = new SpecHelper(assistantJs, new StateMachineSetup(assistantJs));
  specHelper.prepare(
    [
      MainState,
      SecondState,
      UnhandledErrorState,
      UnhandledErrorWithFallbackState,
      PlainState,
      IntentCallbackState,
      FilterAState,
      FilterBState,
      FilterCState,
      ContextAState,
      ContextBState,
      ContextCState,
      ContextDState,
    ],
    [TestFilterA, TestFilterB, TestFilterC, TestFilterD],
    autoBind,
    useChilds,
    autoSetup
  );
  return specHelper;
}

/**
 * Creates request scope in container manually, without firing a request.
 * @param specSetup Return value of createSpecHelper()
 * @param minimalExtraction Extraction result to add to di container for scope opening.
 * You can pass null if you don't want to pass a result. If you don't pass anything, mocks/unifier/extraction will be used
 * @param requestContext Request context to add to di container for scope opening. If you don't pass one, mocks/root/request-context will be used
 */
export function createRequestScope(
  specSetup: SpecHelper,
  minimalExtraction: MinimalRequestExtraction | null = JSON.parse(JSON.stringify(extraction)),
  requestContext: RequestContext = context,
  responseHandler: new (...args: any[]) => BasicHandable<BasicAnswerTypes> = ResponseHandler
) {
  specSetup.createRequestScope(minimalExtraction, requestContext, responseHandler);
}
