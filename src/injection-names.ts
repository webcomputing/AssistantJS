/** Names of injectionable services, leads to fewer typing errors for most important injections */
export const injectionNames = {
  /**
   * Inject an instance of @type {ComponentSpecificLoggerFactory}
   */
  componentSpecificLoggerFactory: "core:root:component-specific-logger-factory",
  /**
   * Inject an instance of @type {EventBusHandler}
   */
  eventBus: "core:root:event-bus",
  /**
   * Inject an instance of @type {HandlerProxyFactory}
   */
  handlerProxyFactory: "core:unifier:handler-proxy-factory",
  /**
   * Inject an instance of @type {Hooks.PipeFactory}
   */
  hookPipeFactory: "core:hook-pipe-factory",
  /**
   * Inject an instance of @type {I18nextWrapper}
   */
  i18nWrapper: "core:i18n:wrapper",
  /**
   * Inject an instance of @type {i18next.I18n}
   */
  i18nInstance: "core:i18n:instance",
  /**
   * Inject an instance of @type {InterpolationResolver}
   */
  i18nInterpolationResolver: "core:i18n:interpolation-resolver",
  /**
   * Inject an instance of @type {I18nextWrapper}
   */
  i18nSpecWrapper: "core:i18n:spec-wrapper",
  /**
   * Inject an instance of @type {Logger}
   */
  logger: "core:root:logger",
  /**
   * Inject an instance of @type {LocalesLoader}
   */
  localesLoader: "core:unifier:locales-loader",
  /**
   * Inject an instance of @type {State.Meta[]}
   */
  metaState: "core:state-machine:meta-states",
  /**
   * Inject an instance of @type {State.Factory}
   */
  stateFactory: "core:state-machine:state-factory",
  /**
   * Inject an instance of @type {string[]}
   */
  stateNames: "core:state-machine:state-names",
  /**
   * Inject an instance of @type {intent[]}
   */
  usedIntents: "core:state-machine:used-intents",
  /**
   * Inject an instance of @type {PlatformGenerator.EntityMapping}
   */
  userEntityMappings: "core:unifier:user-entity-mappings",
  /**
   * Namespace for services which are only available in the request scope.
   */
  current: {
    /**
     * Inject an instance of @type {Array<{ instance: State.Required; name: string; }>}
     */
    contextStatesProvider: "core:state-machine:current-context-states-provider",
    /**
     * Inject an instance of @type {MinimalRequestExtraction}
     */
    extraction: "core:unifier:current-extraction",
    /**
     * Inject an instance of @type {EntityDictionary}
     */
    entityDictionary: "core:unifier:current-entity-dictionary",
    /**
     * Inject an instance of @type {I18nContext}
     */
    i18nContext: "core:i18n:current-context",
    /**
     * Inject an instance of @type {TranslateValuesFor}
     */
    i18nTranslateValuesFor: "core:i18n:current-translate-values-for",
    /**
     * Inject an instance of @type {() => KillSessionService.execute()}
     */
    killSessionService: "core:services:current-kill-session-promise",
    /**
     * Inject an instance of @type {Logger}
     */
    logger: "core:root:current-logger",
    /**
     * Inject an instance of @type {BasicHandable<any>}
     */
    responseHandler: "core:unifier:current-response-handler",
    /**
     * Inject an instance of @type {ResponseHandlerExtensions<any, any>}
     */
    responseHandlerExtensions: "core:unifier:response-handler-extensions",
    /**
     * Inject an instance of @type {RequestContext}
     */
    requestContext: "core:root:current-request-context",
    /**
     * Inject an instance of @type {StateMachine}
     */
    stateMachine: "core:state-machine:current-state-machine",
    /**
     * Inject an instance of @type {State.CurrentNameProvider}
     */
    stateNameProvider: "core:state-machine:current-state-name-provider",
    /**
     * Inject an instance of @type {State.CurrentProvider}
     */
    stateProvider: "core:state-machine:current-state-provider",
    /**
     * Inject an instance of @type {State.CurrentNameProvider}
     */
    stateSetupSet: "core:state-machine:current-state-setup-set",
    /**
     * Inject an instance of @type {CurrentSessionFactory}
     */
    sessionFactory: "core:services:current-session-factory",
    /**
     * Inject an instance of @type {TranslateHelper}
     */
    translateHelper: "core:i18n:current-translate-helper",
  },
};
