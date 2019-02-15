import { createLogger } from "bunyan";
import * as express from "express";
import { ContainerImpl } from "inversify-components";

import { ServerApplication } from "./components/root/app-server";
import { GenericRequestHandler } from "./components/root/generic-request-handler";
import { Logger, RequestContext } from "./components/root/public-interfaces";
import { AfterContextExtension, Filter, State, Transitionable } from "./components/state-machine/public-interfaces";
import { StateMachineSetup } from "./components/state-machine/state-intent-setup";
import { BasicHandable, intent, MinimalRequestExtraction, PlatformSpecHelper } from "./components/unifier/public-interfaces";

import { BaseState, Constructor } from "./assistant-source";
import { TranslateValuesFor } from "./components/i18n/public-interfaces";
import { FilterSetup } from "./components/state-machine/filter-setup";
import { BasicAnswerTypes } from "./components/unifier/response-handler";
import { injectionNames } from "./injection-names";
import { AssistantJSSetup } from "./setup";

/** Describes available options of prepareSpec() */
export interface SpecHelperOptions {
  /** If set to true, calls autobind() on prepareSpec() to bind all dependencies to container. Default = true */
  autoBindOnPrepare: boolean;

  /**
   * If set to true, does not use child containers for every fired request.
   * In consequence, your mocked app can only handle one request instead of handling every incomming request in a seperate independent container scope.
   * This is necessary in nearly every kind of test to mock easily.
   * Default = true
   */
  bindSingletonChildContainer: boolean;

  /**
   * You are able to bind a different logger in specs, which will print less information and always print to stdout.
   * All available built-in bind/logger options are available here.
   */
  loggerOptions: {
    /** Log level of the spec-specific logger. Is only relevant if the spec specific logger is bound, so check out bindCondition, too. Default = "warn" */
    logLevel: Logger.LogLevel;

    /**
     * Defines when the spec-specific logger should be bound and the original application logger unbound.
     * force: Always bind spec-specific logger, don't care about environment variables
     * optOut: Always bind spec-specific logger unless environment variable USE_APPLICATION_LOGGER is set to "true"
     * never: Never bind spec-specific logger, so use application logger in specs
     * Default = optOut
     */
    bindCondition: "force" | "optOut" | "never";
  };

  /**
   * If set to true, all states are registered as singletons, so you will always get the same instance when asking the container for a state or calling specHelper.getState().
   * This is super useful for spying and mocking on states, so if you dealing with states, you probably want this.
   * Default = true
   */
  registerStatesAsSingleton: boolean;
}

/** Helper for specs, which is also useful in other npm modules */
export class SpecHelper {
  constructor(public assistantJs: AssistantJSSetup, public stateMachineSetup: StateMachineSetup = new StateMachineSetup(assistantJs)) {}

  /** Interpretes the given SpecHelperOptions and prepares your spec by binding everyhting to container etc. */
  public prepareSpec(givenOptions: Partial<SpecHelperOptions>) {
    // Set all default values
    const defaults: SpecHelperOptions = {
      autoBindOnPrepare: true,
      bindSingletonChildContainer: true,
      loggerOptions: {
        logLevel: "warn",
        bindCondition: "optOut",
      },
      registerStatesAsSingleton: true,
    };

    // Merge to real options
    const options = { ...defaults, ...givenOptions };

    // Auto bind if configured
    if (options.autoBindOnPrepare) {
      this.assistantJs.autobind();
    }

    // Switch to child containers if configured
    if (options.bindSingletonChildContainer) {
      this.bindChildlessRequestHandlerMock();
    }

    // Bind spec logger if wanted
    const checkedEnvironmentVariable = typeof process.env.USE_APPLICATION_LOGGER === "string" ? process.env.USE_APPLICATION_LOGGER.toLowerCase() : "false";
    if (options.loggerOptions.bindCondition === "force" || (options.loggerOptions.bindCondition === "optOut" && checkedEnvironmentVariable !== "true")) {
      this.bindSpecLogger(options.loggerOptions.logLevel);
    }

    // Set state machine bindings to singleton if wanted
    if (options.registerStatesAsSingleton) {
      this.stateMachineSetup.registerStatesInSingleton = true;
    }
  }

  /**
   * @deprecated since version 0.3.2
   * Prepares assistant js setup
   * @param states States to add to container
   * @param autobind If true, calls setup.autobind()
   * @param useChilds If set to false, does not set child containers
   * @param autoSetup If set to true, registers internal components
   * @param minimumLogLevel If you do not enable logging in specs explicitly using SPEC_LOGS=true, this is the minimum level applied to logger.
   */

  public prepare(
    states: State.Constructor[] = [],
    filters: Array<Constructor<Filter>> = [],
    autoBind = true,
    useChilds = false,
    autoSetup = true,
    minimumLogLevel: Logger.LogLevel = "warn"
  ) {
    // tslint:disable-next-line:no-console
    console.warn("[DEPRECATION] using prepare() is deprecated. Please use prepareSpec() instead!");

    if (autoSetup) this.assistantJs.registerInternalComponents();
    if (states.length > 0) this.registerStates(states);
    if (filters.length > 0) this.registerFilters(filters);

    if (autoBind) this.assistantJs.autobind();
    if (!useChilds) this.bindChildlessRequestHandlerMock();

    // Change logger unless env variable is set
    const specLogging = process.env.SPEC_LOGS || process.env.SPECS_LOG || process.env.SPECS_LOGS || process.env.LOG_SPECS;
    if (!(specLogging === "true")) this.bindSpecLogger(minimumLogLevel);
  }

  /**
   * Prepares an intent call and creates request scope. Use this first in your specs, then call runMachineAndGetResults() to execute the intent method.
   * @param {PlatformSpecHelper<MergedAnswerTypes, MergedHandler>} platformSpecHelper The platform to use to execute this intent
   * @param {intent} intentToCall The intent you want to execute when calling runMachine() afterwards
   * @param {any} additionalExtractions Additional extractions to append, for example to set entities
   */
  public async prepareIntentCall<MergedAnswerTypes extends BasicAnswerTypes, MergedHandler extends BasicHandable<MergedAnswerTypes>>(
    platformSpecHelper: PlatformSpecHelper<MergedAnswerTypes, MergedHandler>,
    intentToCall: intent,
    additionalExtractions = {},
    additionalRequestContext = {}
  ): Promise<MergedHandler> {
    if (typeof platformSpecHelper === "undefined") {
      throw new Error(
        "You passed an undefined platformSpecHelper into prepareIntentCall. Have a look at your declaration of this.platforms in your setup.ts and compare it to what you've passed into prepareIntentCall()."
      );
    }
    return platformSpecHelper.pretendIntentCalled(intentToCall, additionalExtractions, additionalRequestContext);
  }

  /** Runs state machine to execute prepared intent method and collects and return all reponse handler results afterwards */
  public async runMachineAndGetResults<MergedAnswerTypes extends BasicAnswerTypes = BasicAnswerTypes>(stateName: string): Promise<Partial<MergedAnswerTypes>> {
    await this.runMachine(stateName);
    return this.getResponseResults();
  }

  /**
   * Runs state machine. Needs created request scope!
   * @param stateName Name of state to run.
   */
  public async runMachine(stateName: string, ...args): Promise<void> {
    this.throwIfNoRequestScope();

    // Transition to given state
    const machine = this.assistantJs.container.inversifyInstance.get<Transitionable>(injectionNames.current.stateMachine);
    await machine.transitionTo(stateName);

    /**
     * Here, we need the state machine runner instead of machine.handleIntent()
     * because we won't execute after state machine extensions otherwise
     */
    const afterContextExtensions = this.assistantJs.container.inversifyInstance.getAll<AfterContextExtension>(
      this.assistantJs.container.componentRegistry.lookup("core:root").getInterface("afterContextExtension")
    );
    const runner = afterContextExtensions.filter(extensionClass => extensionClass.constructor.name === "Runner")[0];

    return runner.execute(...args);
  }

  /**
   * This Method returns the resolved Results from the current ResponseHandler
   */
  public getResponseResults<MergedAnswerTypes extends BasicAnswerTypes = BasicAnswerTypes>(): Partial<MergedAnswerTypes> {
    const requestHandler: BasicHandable<MergedAnswerTypes> = this.assistantJs.container.inversifyInstance.get(injectionNames.current.responseHandler);

    const results = (requestHandler as any).results as Partial<MergedAnswerTypes>;
    const promises = (requestHandler as any).promises as { [key in keyof MergedAnswerTypes]?: any };

    for (const key in promises) {
      if (promises.hasOwnProperty(key) && (!results.hasOwnProperty(key) || !results[key])) {
        throw new Error("Not all Promises has been resolved. Did you await send() or resolveResults() on the ResponseHandler?");
      }
    }

    return results;
  }

  /**
   * Creates request scope in container manually, without firing a request. Most times, you'd like to call `prepareIntentCall` instead
   * @param minimalExtraction Extraction result to add to di container for scope opening. You can pass null if you don't want to pass a result.
   * @param requestContext Request context to add to di container for scope opening.
   * @param responseHandler If given, this handler is bound to minimalExtraction.component.name + ":current-response-handler.
   * Does  not work with minimalExtraction being null
   */
  public createRequestScope(
    minimalExtraction: MinimalRequestExtraction | null,
    requestContext: RequestContext,
    responseHandler?: new (...args: any[]) => BasicHandable<any>
  ) {
    // Get request handle instance and create child container of it
    const requestHandler = this.assistantJs.container.inversifyInstance.get(GenericRequestHandler);
    const childContainer = requestHandler.createChildContainer(this.assistantJs.container);

    // Bind request context
    requestHandler.bindContextToContainer(requestContext, childContainer, injectionNames.current.requestContext);

    // Add minimal extraction if wanted
    if (minimalExtraction !== null) {
      requestHandler.bindContextToContainer(minimalExtraction, childContainer, injectionNames.current.extraction, true);
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
    this.assistantJs.container.componentRegistry.autobind(childContainer, [], "request", requestContext);
  }

  /**
   * Returns the given state instance. Needs created request scope.
   * @param {string} stateName Name of state to return
   */
  public getState<GivenState extends BaseState<BasicAnswerTypes, BasicHandable<BasicAnswerTypes>>>(stateName: string): GivenState {
    this.throwIfNoRequestScope();

    const stateFactory: State.Factory = this.assistantJs.container.inversifyInstance.get(injectionNames.stateFactory);
    return stateFactory(stateName);
  }

  /**
   * Returns all translation variants for given i18n key. Needs created request scope.
   * This enables you to test the randomly creates AssitantJS response against this list.
   * @param {string} absoluteTranslationKey The absolute path to an translation key. No ".xxx" notation supported, which forces you to also test against your conventions.
   */
  public async translateValuesFor(absoluteTranslationKey: string, options?: any): Promise<string[]> {
    this.throwIfNoRequestScope();

    const translateValuesFor: TranslateValuesFor = this.assistantJs.container.inversifyInstance.get(injectionNames.current.i18nTranslateValuesFor);
    return translateValuesFor(absoluteTranslationKey, options);
  }

  /** Registers states */
  public registerStates(states: State.Constructor[]) {
    const stateMachineSetup = new StateMachineSetup(this.assistantJs);
    states.forEach(state => stateMachineSetup.addState(state));
    stateMachineSetup.registerStates();
  }

  /** Registers filters */
  public registerFilters(filters: Array<Constructor<Filter>>) {
    const filterSetup = new FilterSetup(this.assistantJs);
    filters.forEach(filter => filterSetup.addFilter(filter));
    filterSetup.registerFilters();
  }

  /**
   * Disables the usage of child container for testing purpose by appying ChildlessGenericRequestHandler
   */
  public bindChildlessRequestHandlerMock() {
    this.assistantJs.container.inversifyInstance.unbind(GenericRequestHandler);
    this.assistantJs.container.inversifyInstance.bind(GenericRequestHandler).to(ChildlessGenericRequestHandler);
  }

  /**
   * Changes logger to a new one without any streams configured. Makes the logger silent.
   */
  public bindSpecLogger(minimumLevel: Logger.LogLevel) {
    this.assistantJs.container.inversifyInstance.unbind(injectionNames.logger);
    this.assistantJs.container.inversifyInstance
      .bind<Logger>(injectionNames.logger)
      .toConstantValue(createLogger({ name: "assistantjs-testing", streams: [{ level: minimumLevel, stream: process.stdout }] }));
  }

  /**
   * Creates a express server configured with ServerApplication.
   * @param expressApp If given, express app to use
   *
   * @return Promise<Function> stopFunction If you call this function, server will be stopped.
   */
  public withServer(expressApp: express.Express = express()): Promise<() => void> {
    return new Promise(resolve => {
      this.assistantJs.run(
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

  /** Throws an error if no request scope was created */
  private throwIfNoRequestScope() {
    if (
      !this.assistantJs.container.inversifyInstance.isBound(injectionNames.current.extraction) ||
      !this.assistantJs.container.inversifyInstance.isBound(injectionNames.current.requestContext)
    ) {
      throw new Error("There is no request scope. Please create request scope first by calling this.prepareIntentCall() or this.createRequestScope().");
    }
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
