import { ComponentDescriptor, BindingDescriptor, ExecutableExtension, Component } from "inversify-components";
import { interfaces as inversifyInterfaces } from "inversify";

import { DestroyableSession } from "../services/interfaces";
import { ContextDeriver as ContextDeriverI, GeneratorExtension } from "../root/interfaces";
import { ContextDeriver } from "./context-deriver";
import { ResponseFactory as ResponseFactoryImpl } from "./response-factory";
import { Generator } from "./generator";
import { EntityDictionary as EntityDictionaryImpl } from "./entity-dictionary";
import { KillSessionService } from "./kill-session-service";
import { swapHash } from "./swap-hash";
import { componentInterfaces, MinimalRequestExtraction, OptionalConfiguration, ResponseFactory, 
  EntityDictionary, MinimalResponseHandler, GeneratorEntityMapping, Configuration } from "./interfaces";

let configuration: OptionalConfiguration = {
  utterancePath: process.cwd() + "/config/locales",
  entities: {},
  failSilentlyOnUnsupportedFeatures: true
}

export const descriptor: ComponentDescriptor = {
  name: "core:unifier",
  interfaces: componentInterfaces,
  defaultConfiguration: configuration,
  bindings: {
    root: (bindService, lookupService) => {
      bindService.bindExtension<ContextDeriverI>(lookupService.lookup("core:root").getInterface("contextDeriver")).to(ContextDeriver);
      bindService.bindExtension<GeneratorExtension>(lookupService.lookup("core:root").getInterface("generator")).to(Generator);

      // Bind swapped entity configuration
      bindService.bindGlobalService<GeneratorEntityMapping>("user-entity-mappings").toDynamicValue(context => {
        return swapHash((context.container.get<Component>("meta:component//core:unifier").configuration as Configuration).entities);
      });
      
      // Bind same swapped entity configuration to own extension
      bindService.bindExtension<GeneratorEntityMapping>(componentInterfaces.entityMapping).toDynamicValue(context =>
        context.container.get<GeneratorEntityMapping>("core:unifier:user-entity-mappings"));
    },

    request: (bindService, lookupService) => {
      bindService.bindGlobalService<inversifyInterfaces.Factory<DestroyableSession>>("current-session-factory").toFactory<DestroyableSession>(context => {
        return ()  => {
          let currentExtraction = context.container.get<MinimalRequestExtraction>("core:unifier:current-extraction");

          return context.container.get<inversifyInterfaces.Factory<DestroyableSession>>("core:services:session-factory")(currentExtraction.sessionID);
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
    }
  }
};