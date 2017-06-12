import { ContainerImpl, Container } from "ioc-container";

import { AssistantJSSetup } from "../../../src/setup";
import { GenericRequestHandler } from "../../../src/components/root/generic-request-handler";
import { RequestContext } from "../../../src/components/root/interfaces";
import { MinimalRequestExtraction } from "../../../src/components/unifier/interfaces";
import { ChildlessGenericRequestHandler } from "../mocks/root/childless-generic-request-handler";
import { StateMachineSetup } from "../../../src/components/state-machine/setup";

import { MainState } from "../mocks/states/main";
import { SecondState } from "../mocks/states/second";
import { context } from "../mocks/root/request-context";
import { extraction } from "../mocks/unifier/extraction";

/**
 * Creates a test assistant js setup
 * @param useMockStates If set to true, mock states (see mock/states -> Main and Second) will be added to setup
 * @param useChilds If set to true, child container for requests will be used, else mock/ChildlessGenericRequestHandler will be applied
 * @param autoBind If set to true, assistantJs.autobind() will be called for you
 * @param autoSetup If set to true, assistantJs.registerInternalComponents() will be called for you
 */
export function createTestAssistantJsSetup(useMockStates = true, useChilds = false, autoBind = true, autoSetup = true): AssistantJSSetup {
  let assistantJs = new AssistantJSSetup(new ContainerImpl());

  if (autoSetup) assistantJs.registerInternalComponents();
  if (useMockStates) registerMockStates(assistantJs);
  if (autoBind) assistantJs.autobind();
  if (!useChilds) bindChildlessRequestHandlerMock(assistantJs.container);

  return assistantJs;
}

/**
 * Disables the usage of child container for testing purpose by appying ChildlessGenericRequestHandler
 */
export function bindChildlessRequestHandlerMock(container: Container) {
  container.inversifyInstance.unbind(GenericRequestHandler);
  container.inversifyInstance.bind(GenericRequestHandler).to(ChildlessGenericRequestHandler);
}


/**
 * Adds mock states to container (see mocks/states -> Main and Second)
 */
export function registerMockStates(assistantJs: AssistantJSSetup) {
  let stateMachineSetup = new StateMachineSetup(assistantJs);
  stateMachineSetup.addState(MainState);
  stateMachineSetup.addState(SecondState);
  stateMachineSetup.registerStates();
}

/**
 * Creates request scope in container manually, without firing a request.
 * @param assistantJs The assistantJs instance to manipulate
 * @param minimalExtraction Extraction result to add to di container for scope opening. 
 * You can pass null if you don't want to pass a result. If you don't pass anything, mocks/unifier/extraction will be used
 * @param requestContext Request context to add to di container for scope opening. If you don't pass one, mocks/root/request-context will be used
 */
export function createRequestScope(assistantJs: AssistantJSSetup, minimalExtraction?: MinimalRequestExtraction | null, requestContext?: RequestContext) {
  // Apply default values
  if (typeof minimalExtraction === "undefined") {
    minimalExtraction = extraction;
  }
  if (typeof requestContext === "undefined") {
    requestContext = context;
  }

  // Get request handle instance and create child container of it
  let requestHandle = assistantJs.container.inversifyInstance.get(GenericRequestHandler);
  let childContainer = requestHandle.createChildContainer(assistantJs.container);

  // Bind request context
  requestHandle.bindContextToContainer(requestContext, childContainer, "core:root:current-request-context");

  // Add minimal extraction if wanted
  if (minimalExtraction !== null) {
    requestHandle.bindContextToContainer(minimalExtraction, childContainer, "core:unifier:current-extraction");
  }

  // Open request scope
  assistantJs.container.componentRegistry.autobind(childContainer, [], "request", requestContext);
}