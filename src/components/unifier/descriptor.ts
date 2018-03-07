import { ComponentDescriptor, BindingDescriptor, ExecutableExtension, Component } from "inversify-components";
import { interfaces as inversifyInterfaces } from "inversify";

import { Session } from "../services/public-interfaces";
import { ContextDeriver as ContextDeriverI, CLIGeneratorExtension, LoggerMiddleware } from "../root/public-interfaces";
import { ContextDeriver } from "./context-deriver";
import { ResponseFactory as ResponseFactoryImpl } from "./response-factory";
import { Generator } from "./generator";
import { EntityDictionary as EntityDictionaryImpl } from "./entity-dictionary";
import { KillSessionService } from "./kill-session-service";
import { swapHash } from "./swap-hash";
import { createUnifierLoggerMiddleware } from "./logger-middleware";
import { MinimalRequestExtraction, ResponseFactory, EntityDictionary, MinimalResponseHandler, PlatformGenerator } from "./public-interfaces";
import { componentInterfaces, Configuration } from "./private-interfaces";

const configuration: Configuration.Defaults = {
  utterancePath: process.cwd() + "/config/locales",
  entities: {},
  failSilentlyOnUnsupportedFeatures: true,
  logExtractionWhitelist: ["platform", "device", "intent", "language"]
}

export const descriptor: ComponentDescriptor<Configuration.Defaults> = {
  name: "core:unifier",
  interfaces: componentInterfaces,
  defaultConfiguration: configuration,
  bindings: {
    root: (bindService, lookupService) => {
      bindService.bindExtension<ContextDeriverI>(lookupService.lookup("core:root").getInterface("contextDeriver")).to(ContextDeriver);
      bindService.bindExtension<CLIGeneratorExtension>(lookupService.lookup("core:root").getInterface("generator")).to(Generator);

      // Bind swapped entity configuration
      bindService.bindGlobalService<PlatformGenerator.EntityMapping>("user-entity-mappings").toDynamicValue(context => {
        return swapHash(context.container.get<Component<Configuration.Runtime>>("meta:component//core:unifier").configuration.entities);
      });
      
      // Bind same swapped entity configuration to own extension
      bindService.bindExtension<PlatformGenerator.EntityMapping>(componentInterfaces.entityMapping).toDynamicValue(context =>
        context.container.get<PlatformGenerator.EntityMapping>("core:unifier:user-entity-mappings"));
    },

    request: (bindService, lookupService) => {
      bindService.bindGlobalService<inversifyInterfaces.Factory<Session>>("current-session-factory").toFactory<Session>(context => {
        return ()  => {
          let currentExtraction = context.container.get<MinimalRequestExtraction>("core:unifier:current-extraction");

          return context.container.get<inversifyInterfaces.Factory<Session>>("core:services:session-factory")(currentExtraction.sessionID);
        }
      });

      bindService.bindGlobalService<MinimalResponseHandler>("current-response-handler").toDynamicValue(context => {
        let currentExtraction = context.container.get<MinimalRequestExtraction>("core:unifier:current-extraction");

        return context.container.get<MinimalResponseHandler>(currentExtraction.platform + ":current-response-handler");
      });

      bindService.bindGlobalService<ResponseFactory>("current-response-factory").to(ResponseFactoryImpl);

      bindService.bindGlobalService<EntityDictionary>("current-entity-dictionary").to(EntityDictionaryImpl).inSingletonScope();

      bindService.bindLocalServiceToSelf(KillSessionService);
      bindService.bindGlobalService("current-kill-session-promise").toProvider(context => {
        return () => {
          let killService = context.container.get(KillSessionService);
          return killService.execute();
        }
      });

      // Add unifiers logger middleware to current logger
      bindService.bindExtension<LoggerMiddleware>(lookupService.lookup("core:root").getInterface("loggerMiddleware")).toDynamicValue(context => {
        const currentExtraction = context.container.isBound("core:unifier:current-extraction") ? context.container.get<MinimalRequestExtraction>("core:unifier:current-extraction") : undefined;
        return createUnifierLoggerMiddleware(currentExtraction);
      });
    }
  }
};