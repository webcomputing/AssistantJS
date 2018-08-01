import { createLogger } from "bunyan";
import * as express from "express";
import { ContainerImpl } from "inversify-components";

import { ServerApplication } from "./components/root/app-server";
import { GenericRequestHandler } from "./components/root/generic-request-handler";
import { Logger, RequestContext } from "./components/root/public-interfaces";
import { AfterContextExtension, Filter, State, Transitionable } from "./components/state-machine/public-interfaces";
import { StateMachineSetup } from "./components/state-machine/state-intent-setup";
import { BasicHandable, intent, MinimalRequestExtraction } from "./components/unifier/public-interfaces";

import { Constructor } from "./assistant-source";
import { FilterSetup } from "./components/state-machine/filter-setup";
import { BasicAnswerTypes, BasicHandler } from "./components/unifier/response-handler";
import { injectionNames } from "./injection-names";
import { AssistantJSSetup } from "./setup";

/** Helper for specs, which is also useful in other npm modules */
export class SpecHelper {
  public setup: AssistantJSSetup;

  constructor(originalSetup: AssistantJSSetup = new AssistantJSSetup(new ContainerImpl())) {
    this.setup = originalSetup;
  }

  /**
   * Prepares assistant js setup
   * @param states States to add to container
   * @param autobind If true, calls setup.autobind()
   * @param useChilds If set to false, does not set child containers
   * @param autoSetup If set to true, registers internal components
   */
  public prepare(states: State.Constructor[] = [], filters: Array<Constructor<Filter>> = [], autoBind = true, useChilds = false, autoSetup = true) {
    if (autoSetup) this.setup.registerInternalComponents();
    if (states.length > 0) this.registerStates(states);
    if (filters.length > 0) this.registerFilters(filters);

    if (autoBind) this.setup.autobind();
    if (!useChilds) this.bindChildlessRequestHandlerMock();

    // Change logger unless env variable is set
    const specLogging = process.env.SPEC_LOGS || process.env.SPECS_LOG || process.env.SPECS_LOGS || process.env.LOG_SPECS;
    if (!(specLogging === "true")) this.bindSpecLogger();
  }

  /**
   * Creates request scope in container manually, without firing a request.
   * @param minimalExtraction Extraction result to add to di container for scope opening.
   * You can pass null if you don't want to pass a result.
   * @param requestContext Request context to add to di container for scope opening.
   * @param responseHandler If given, this handler is bound to minimalExtraction.component.name + ":current-response-handler.
   * Does  not work with minimalExtraction being null
   */
  public createRequestScope(
    minimalExtraction: MinimalRequestExtraction | null,
    requestContext: RequestContext,
    responseHandler?: { new (...args: any[]): BasicHandable<any> }
  ) {
    // Get request handle instance and create child container of it
    const requestHandler = this.setup.container.inversifyInstance.get(GenericRequestHandler);
    const childContainer = requestHandler.createChildContainer(this.setup.container);

    // Bind request context
    requestHandler.bindContextToContainer(requestContext, childContainer, "core:root:current-request-context");

    // Add minimal extraction if wanted
    if (minimalExtraction !== null) {
      requestHandler.bindContextToContainer(minimalExtraction, childContainer, "core:unifier:current-extraction", true);
    }

    // Add minimal response handler
    if (typeof responseHandler !== "undefined") {
      if (minimalExtraction !== null) {
        childContainer.bind<BasicHandable<any>>(minimalExtraction.platform + ":current-response-handler").to(responseHandler);
      } else {
        throw new Error("You cannot pass a null value for minimalExtraction but expecting a responseHandler to bind");
      }
    }

    // Open request scope
    this.setup.container.componentRegistry.autobind(childContainer, [], "request", requestContext);
  }

  /**
   * Runs state machine. Needs request scope opened!
   * @param stateName Name of state to run. If not passed, uses state in session
   * @param intent Name of intent to run. If not passed, uses extracted intent
   */
  public async runMachine(stateName?: string, intent?: intent) {
    if (
      this.setup.container.inversifyInstance.isBound("core:unifier:current-extraction") &&
      this.setup.container.inversifyInstance.isBound("core:state-machine:current-state-machine")
    ) {
      // get current Extraction, set intent and bind it back to
      const extraction = this.setup.container.inversifyInstance.get<MinimalRequestExtraction>("core:unifier:current-extraction");
      if (intent) {
        extraction.intent = intent;
      }
      this.setup.container.inversifyInstance.unbind("core:unifier:current-extraction");
      this.setup.container.inversifyInstance.bind<MinimalRequestExtraction>("core:unifier:current-extraction").toConstantValue(extraction);

      const machine = this.setup.container.inversifyInstance.get<Transitionable>("core:state-machine:current-state-machine");

      if (typeof stateName !== "undefined") {
        await machine.transitionTo(stateName);
      }

      /**
       * Here, we need the state machine runner instead of machine.handleIntent()
       * because we won't execute after state machine extensions otherwise
       */
      const afterContextExtensions = this.setup.container.inversifyInstance.getAll<AfterContextExtension>(
        this.setup.container.componentRegistry.lookup("core:root").getInterface("afterContextExtension")
      );
      const runner = afterContextExtensions.filter(extensionClass => extensionClass.constructor.name === "Runner")[0];

      return runner.execute();
    }

    throw new Error("You cannot run machine without request scope opened. Did you call createRequestScope() or pretendIntentCalled()?");
  }

  /** Registers states */
  public registerStates(states: State.Constructor[]) {
    const stateMachineSetup = new StateMachineSetup(this.setup);
    states.forEach(state => stateMachineSetup.addState(state));
    stateMachineSetup.registerStates();
  }

  /** Registers filters */
  public registerFilters(filters: Array<Constructor<Filter>>) {
    const filterSetup = new FilterSetup(this.setup);
    filters.forEach(filter => filterSetup.addFilter(filter));
    filterSetup.registerFilters();
  }

  /**
   * Disables the usage of child container for testing purpose by appying ChildlessGenericRequestHandler
   */
  public bindChildlessRequestHandlerMock() {
    this.setup.container.inversifyInstance.unbind(GenericRequestHandler);
    this.setup.container.inversifyInstance.bind(GenericRequestHandler).to(ChildlessGenericRequestHandler);
  }

  /**
   * Changes logger to a new one without any streams configured. Makes the logger silent.
   */
  public bindSpecLogger() {
    this.setup.container.inversifyInstance.unbind(injectionNames.logger);
    this.setup.container.inversifyInstance
      .bind<Logger>(injectionNames.logger)
      .toConstantValue(createLogger({ name: "assistantjs-testing", streams: [{ level: "error", stream: process.stdout }] }));
  }

  /**
   * Creates a express server configured with ServerApplication.
   * @param expressApp If given, express app to use
   *
   * @return Promise<Function> stopFunction If you call this function, server will be stopped.
   */
  public withServer(expressApp: express.Express = express()): Promise<Function> {
    return new Promise(resolve => {
      this.setup.run(
        new ServerApplication(
          3000,
          app => {
            resolve(() => {
              app.stop();
            });
          },
          expressApp
        )
      );
    });
  }

  /**
   * This Method returns the resolved Results from the current ResponseHandler
   */
  public getResponseResults<MergedTypes extends BasicAnswerTypes = BasicAnswerTypes>(): Partial<MergedTypes> {
    const requestHandler: BasicHandable<MergedTypes> = this.setup.container.inversifyInstance.get(injectionNames.current.responseHandler);

    const results = (requestHandler as any).results as Partial<MergedTypes>;
    const promises = (requestHandler as any).promises as { [key in keyof MergedTypes]?: any };

    for (const key in promises) {
      if (promises.hasOwnProperty(key) && (!results.hasOwnProperty(key) || !results[key])) {
        throw new Error("Not all Promises has been resolved. Did you await send() on the ResponseHandler?");
      }
    }

    return results;
  }
}

/**
 * This is an implementation of GenericRequestHandle which DOES NOT spawn a child container,
 * but uses the parent container instead. Nice for testing.
 */
// tslint:disable-next-line:max-classes-per-file
export class ChildlessGenericRequestHandler extends GenericRequestHandler {
  public createChildContainer(container) {
    return container.inversifyInstance;
  }
}
