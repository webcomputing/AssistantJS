/** Names of injectionable services, leads to fewer typing errors for most important injections */
export const injectionNames = {
  "i18nWrapper": "core:i18n:wrapper",
  "redisInstance": "core:services:redis-instance",
  "stateFactory": "core:state-machine:state-factory",
  "current": {
    "translateHelper": "core:i18n:current-translate-helper",
    "stateMachine": "core:state-machine:current-state-machine",
    "sessionFactory": "core:unifier:current-session-factory",
    "extraction": "core:unifier:current-extraction",
    "responseFactory": "core:unifier:current-response-factory",
    "entityDictionary": "core:unifier:current-entity-dictionary",
    "responseHandler": "core:unifier:current-response-handler"
  }
}