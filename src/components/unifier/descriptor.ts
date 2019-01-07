import { Component, ComponentDescriptor } from "inversify-components";

import { injectionNames } from "../../injection-names";
import { CLIGeneratorExtension, ContextDeriver as ContextDeriverI, LoggerMiddleware } from "../root/public-interfaces";
import { ContextDeriver } from "./context-deriver";
import { EntityDictionary as EntityDictionaryImpl } from "./entity-dictionary";
import { Generator } from "./generator";
import { LocalesLoader } from "./locales-loader";
import { createUnifierLoggerMiddleware } from "./logger-middleware";
import { componentInterfaces, Configuration } from "./private-interfaces";
import {
  AfterResponseHandler,
  BeforeResponseHandler,
  EntityDictionary,
  MinimalRequestExtraction,
  PlatformGenerator,
  ResponseHandlerExtensions,
} from "./public-interfaces";
import { BasicHandable, HandlerProxyFactory } from "./response-handler";
import { AfterStateResponseSender } from "./response-handler/after-state-handler";
import { swapHash } from "./swap-hash";

const configuration: Configuration.Defaults = {
  utterancePath: process.cwd() + "/config/locales",
  entities: {},
  failSilentlyOnUnsupportedFeatures: true,
  logExtractionWhitelist: ["platform", "device", "intent", "language"],
};

export const descriptor: ComponentDescriptor<Configuration.Defaults> = {
  name: "core:unifier",
  interfaces: componentInterfaces,
  defaultConfiguration: configuration,
  bindings: {
    root: (bindService, lookupService) => {
      bindService.bindExtension<ContextDeriverI>(lookupService.lookup("core:root").getInterface("contextDeriver")).to(ContextDeriver);
      bindService.bindExtension<CLIGeneratorExtension>(lookupService.lookup("core:root").getInterface("generator")).to(Generator);

      // Bind locales loader
      bindService
        .bindGlobalService("locales-loader")
        .to(LocalesLoader)
        .inSingletonScope();

      // Bind swapped entity configuration
      bindService.bindGlobalService<PlatformGenerator.EntityMapping>("user-entity-mappings").toDynamicValue(context => {
        return swapHash(context.container.get<Component<Configuration.Runtime>>("meta:component//core:unifier").configuration.entities);
      });

      // Bind same swapped entity configuration to own extension
      bindService
        .bindExtension<PlatformGenerator.EntityMapping>(componentInterfaces.entityMapping)
        .toDynamicValue(context => context.container.get<PlatformGenerator.EntityMapping>("core:unifier:user-entity-mappings"));

      // bind HandlerProxyFactory
      bindService
        .bindGlobalService("handler-proxy-factory")
        .to(HandlerProxyFactory)
        .inSingletonScope();
    },

    request: (bindService, lookupService) => {
      bindService
        .bindGlobalService<BasicHandable<any>>("current-response-handler")
        .toDynamicValue(context => {
          const currentExtraction = context.container.get<MinimalRequestExtraction>(injectionNames.current.extraction);
          const platformSpecificHandler = context.container.get<BasicHandable<any>>(currentExtraction.platform + ":current-response-handler");
          const handlerProxyFactory = context.container.get<HandlerProxyFactory>(injectionNames.handlerProxyFactory);

          return handlerProxyFactory.createHandlerProxy(platformSpecificHandler);
        })
        .inSingletonScope();

      bindService.bindGlobalService<ResponseHandlerExtensions<any, any>>("response-handler-extensions").toDynamicValue(context => {
        const afterExtensions = context.container.isBound(componentInterfaces.afterSendResponse)
          ? context.container.getAll<AfterResponseHandler<any>>(componentInterfaces.afterSendResponse)
          : [];
        const beforeExtensions = context.container.isBound(componentInterfaces.beforeSendResponse)
          ? context.container.getAll<BeforeResponseHandler<any, any>>(componentInterfaces.beforeSendResponse)
          : [];

        return {
          afterExtensions,
          beforeExtensions,
        };
      });

      bindService
        .bindGlobalService<EntityDictionary>("current-entity-dictionary")
        .to(EntityDictionaryImpl)
        .inSingletonScope();

      // Add unifiers logger middleware to current logger
      bindService.bindExtension<LoggerMiddleware>(lookupService.lookup("core:root").getInterface("loggerMiddleware")).toDynamicValue(context => {
        const currentExtraction = context.container.isBound("core:unifier:current-extraction")
          ? context.container.get<MinimalRequestExtraction>("core:unifier:current-extraction")
          : undefined;
        return createUnifierLoggerMiddleware(currentExtraction);
      });

      // send all unsent messages
      bindService.bindExtension(lookupService.lookup("core:state-machine").getInterface("afterStateMachine")).to(AfterStateResponseSender);
    },
  },
};
