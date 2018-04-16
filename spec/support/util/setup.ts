import { Container, ContainerImpl } from "inversify-components";

import { GenericRequestHandler } from "../../../src/components/root/generic-request-handler";
import { RequestContext } from "../../../src/components/root/public-interfaces";
import { StateMachineSetup } from "../../../src/components/state-machine/setup";
import { MinimalRequestExtraction, MinimalResponseHandler } from "../../../src/components/unifier/public-interfaces";
import { AssistantJSSetup } from "../../../src/setup";

import { SpecSetup } from "../../../src/spec-setup";

import { context } from "../mocks/root/request-context";
import { IntentCallbackState } from "../mocks/states/intent-callbacks";
import { MainState } from "../mocks/states/main";
import { PlainState } from "../mocks/states/plain";
import { SecondState } from "../mocks/states/second";
import { UnhandledErrorState } from "../mocks/states/unhandled-error";
import { UnhandledErrorWithFallbackState } from "../mocks/states/unhandled-error-with-fallback";
import { extraction } from "../mocks/unifier/extraction";
import { ResponseHandler } from "../mocks/unifier/handler";

/**
 * Creates a test assistant js setup
 * @param useMockStates If set to true, mock states (see mock/states -> Main and Second) will be added to setup
 * @param useChilds If set to true, child container for requests will be used, else mock/ChildlessGenericRequestHandler will be applied
 * @param autoBind If set to true, assistantJs.autobind() will be called for you
 * @param autoSetup If set to true, assistantJs.registerInternalComponents() will be called for you
 */
export function createSpecHelper(useMockStates = true, useChilds = false, autoBind = true, autoSetup = true): SpecSetup {
  const assistantJs = new SpecSetup(new AssistantJSSetup(new ContainerImpl()));
  assistantJs.prepare(
    [MainState, SecondState, UnhandledErrorState, UnhandledErrorWithFallbackState, PlainState, IntentCallbackState],
    autoBind,
    useChilds,
    autoSetup
  );
  return assistantJs;
}

/**
 * Creates request scope in container manually, without firing a request.
 * @param specSetup Return value of createSpecHelper()
 * @param minimalExtraction Extraction result to add to di container for scope opening.
 * You can pass null if you don't want to pass a result. If you don't pass anything, mocks/unifier/extraction will be used
 * @param requestContext Request context to add to di container for scope opening. If you don't pass one, mocks/root/request-context will be used
 */
export function createRequestScope(
  specSetup: SpecSetup,
  minimalExtraction: MinimalRequestExtraction | null = extraction,
  requestContext: RequestContext = context,
  responseHandler: { new (...args: any[]): MinimalResponseHandler } = ResponseHandler
) {
  specSetup.createRequestScope(minimalExtraction, requestContext, responseHandler);
}
