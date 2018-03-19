/** Names of injectionable services, leads to fewer typing errors for most important injections */
export const injectionNames = {
  i18nWrapper: "core:i18n:wrapper",
  i18nTranslateValuesFor: "core:i18n:translate-values-for",
  redisInstance: "core:services:redis-instance",
  stateFactory: "core:state-machine:state-factory",
  logger: "core:root:logger",
  eventBus: "core:root:event-bus",
  componentSpecificLoggerFactory: "core:root:component-specific-logger-factory",
  current: {
    translateHelper: "core:i18n:current-translate-helper",
    stateMachine: "core:state-machine:current-state-machine",
    stateNameProvider: "core:state-machine:current-state-name-provider",
    stateProvider: "core:state-machine:current-state-provider",
    stateSetupSet: "core:state-machine:current-state-setup-set",
    sessionFactory: "core:unifier:current-session-factory",
    extraction: "core:unifier:current-extraction",
    responseFactory: "core:unifier:current-response-factory",
    entityDictionary: "core:unifier:current-entity-dictionary",
    responseHandler: "core:unifier:current-response-handler",
    logger: "core:root:current-logger",
  },
};
