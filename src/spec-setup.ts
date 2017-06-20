import { ContainerImpl } from "ioc-container";
import * as express from "express";

import { GenericRequestHandler } from "./components/root/generic-request-handler";
import { StateMachineSetup } from "./components/state-machine/setup";
import { StateConstructor } from "./components/state-machine/interfaces";
import { RequestContext } from "./components/root/interfaces";
import { MinimalRequestExtraction, MinimalResponseHandler } from "./components/unifier/interfaces";
import { ServerApplication } from "./components/root/app-server"; 

import { AssistantJSSetup } from "./setup";

/** Helper for specs, which is also useful in other npm modules */
export class SpecSetup {
  setup: AssistantJSSetup;

  constructor(originalSetup: AssistantJSSetup = new AssistantJSSetup(new ContainerImpl())) {
    this.setup = originalSetup;
  }

  /** 
   * Prepares assistant js setup 
   * @param states States to add to container
   * @param autobind If true, calls setup.autobind()
   * @param useChilds If set to false, does not set child containers
   * @param autoSetup If set to true, registers internal components
   * */
  prepare(states: StateConstructor[] = [], autoBind = true, useChilds = false, autoSetup = true) {
    if (autoSetup) this.setup.registerInternalComponents();
    this.registerStates(states);

    if (autoBind) this.setup.autobind();
    if (!useChilds) this.bindChildlessRequestHandlerMock();
  }

  /**
   * Creates request scope in container manually, without firing a request.
   * @param minimalExtraction Extraction result to add to di container for scope opening. 
   * You can pass null if you don't want to pass a result.
   * @param requestContext Request context to add to di container for scope opening.
   * @param responseHandler If given, this handler is bound to minimalExtraction.component.name + ":current-response-handler.
   * Does  not work with minimalExtraction being null
   */
  createRequestScope(minimalExtraction: MinimalRequestExtraction | null, requestContext: RequestContext, responseHandler?: { new(...args: any[]): MinimalResponseHandler }) {
    // Get request handle instance and create child container of it
    let requestHandle = this.setup.container.inversifyInstance.get(GenericRequestHandler);
    let childContainer = requestHandle.createChildContainer(this.setup.container);

    // Bind request context
    requestHandle.bindContextToContainer(requestContext, childContainer, "core:root:current-request-context");

    // Add minimal extraction if wanted
    if (minimalExtraction !== null) {
      requestHandle.bindContextToContainer(minimalExtraction, childContainer, "core:unifier:current-extraction");
    }

    // Add minimal response handler
    if (typeof responseHandler !== "undefined") {
      if (minimalExtraction !== null) {
        childContainer.bind<MinimalResponseHandler>(minimalExtraction.component.name + ":current-response-handler").to(responseHandler);
      }
      else {
        throw new Error("You cannot pass a null value for minimalExtraction but expecting a responseHandler to bind");
      }
    }

    // Open request scope
    this.setup.container.componentRegistry.autobind(childContainer, [], "request", requestContext);
  }

  /** Registers states */
  registerStates(states: StateConstructor[]) {
    let stateMachineSetup = new StateMachineSetup(this.setup);
    states.forEach(state => stateMachineSetup.addState(state));
    stateMachineSetup.registerStates();
  }

  /**
   * Disables the usage of child container for testing purpose by appying ChildlessGenericRequestHandler
   */
  bindChildlessRequestHandlerMock() {
    this.setup.container.inversifyInstance.unbind(GenericRequestHandler);
    this.setup.container.inversifyInstance.bind(GenericRequestHandler).to(ChildlessGenericRequestHandler);
  }

  /** 
   * Creates a express server configured with ServerApplication.
   * @param expressApp If given, express app to use 
   * 
   * @return Promise<Function> stopFunction If you call this function, server will be stopped.
   */
  withServer(expressApp: express.Express = express()): Promise<Function> {
    return new Promise(resolve => {
      this.setup.run(new ServerApplication((app) => {
        resolve(() => { app.stop() });
      }, expressApp));
    });
  }
}

/** 
 * This is an implementation of GenericRequestHandle which DOES NOT spawn a child container,
 * but uses the parent container instead. Nice for testing.
 */
export class ChildlessGenericRequestHandler extends GenericRequestHandler {
  createChildContainer(container) {
    return container.inversifyInstance;
  }
}