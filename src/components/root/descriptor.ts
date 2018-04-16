import { Component, ComponentDescriptor } from "inversify-components";
import { componentSpecificLoggerFactoryByContainer } from "./component-specific-logger-factory";
import { defaultBunyan } from "./default-bunyan";
import { GenericRequestHandler } from "./generic-request-handler";
import { componentInterfaces, Configuration } from "./private-interfaces";
import { ComponentSpecificLoggerFactory, Logger, LoggerMiddleware, RequestContext } from "./public-interfaces";

import { componentInterfaces as temp } from "../unifier/private-interfaces";
import { EventBusHandler } from "./event-bus";

const defaultConfiguration: Configuration.Defaults = {
  bunyanInstance: defaultBunyan,
};

export const descriptor: ComponentDescriptor<Configuration.Defaults> = {
  name: "core:root",
  interfaces: componentInterfaces,
  defaultConfiguration,
  bindings: {
    root: bindService => {
      bindService.bindLocalServiceToSelf(GenericRequestHandler);
      bindService.bindGlobalService("logger").toDynamicValue(context => {
        return context.container.get<Component<Configuration.Runtime>>("meta:component//core:root").configuration.bunyanInstance;
      });

      bindService
        .bindGlobalService<ComponentSpecificLoggerFactory>("component-specific-logger-factory")
        .toDynamicValue(context => componentSpecificLoggerFactoryByContainer(context.container));

      bindService
        .bindGlobalService("event-bus")
        .to(EventBusHandler)
        .inSingletonScope();
    },
    request: bindService => {
      bindService
        .bindGlobalService("current-logger")
        .toDynamicValue(context => {
          const rootLogger = context.container.get<Logger>("core:root:logger");
          const currentRequest = context.container.get<RequestContext>("core:root:current-request-context");

          // Create reqeuest specific child logger
          let requestSpecificChildLogger = rootLogger.child({ requestId: currentRequest.id });

          // Let other components add parameters to requestSpecificChildLogger by creating new child instance through middlewares
          if (context.container.isBound(componentInterfaces.loggerMiddleware)) {
            const middlewares = context.container.getAll<LoggerMiddleware>(componentInterfaces.loggerMiddleware);
            requestSpecificChildLogger = middlewares.reduce((prev, curr) => curr(prev), requestSpecificChildLogger);
          }

          return requestSpecificChildLogger;
        })
        .inSingletonScope();
    },
  },
};
