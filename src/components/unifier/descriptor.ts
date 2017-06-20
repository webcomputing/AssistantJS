import { ComponentDescriptor, BindingDescriptor } from "ioc-container";
import { interfaces as inversifyInterfaces } from "inversify";

import { DestroyableSession } from "../services/interfaces";
import { ContextDeriver as ContextDeriverI, GeneratorExtension } from "../root/interfaces";
import { ContextDeriver } from "./context-deriver";
import { ResponseFactory as ResponseFactoryImpl } from "./response-factory";
import { Generator } from "./generator";
import { EntityDictionary as EntityDictionaryImpl } from "./entitiy-dictionary";
import { SessionEndedCallback } from "./session-ended-callback";
import { componentInterfaces, MinimalRequestExtraction, OptionalConfiguration, ResponseFactory, EntityDictionary, MinimalResponseHandler } from "./interfaces";

let configuration: OptionalConfiguration = {
  utterancePath: process.cwd() + "config/locales"
}

export const descriptor: ComponentDescriptor = {
  name: "core:unifier",
  interfaces: componentInterfaces,
  defaultConfiguration: configuration,
  bindings: {
    root: (bindService, lookupService) => {
      bindService.bindExtension<ContextDeriverI>(lookupService.lookup("core:root").getInterface("contextDeriver")).to(ContextDeriver);
      bindService.bindExtension<GeneratorExtension>(lookupService.lookup("core:root").getInterface("generator")).to(Generator);
    },

    request: (bindService) => {
      bindService.bindGlobalService<inversifyInterfaces.Factory<DestroyableSession>>("current-session-factory").toFactory<DestroyableSession>(context => {
        return ()  => {
          let currentExtraction = context.container.get<MinimalRequestExtraction>("core:unifier:current-extraction");

          return context.container.get<inversifyInterfaces.Factory<DestroyableSession>>("core:services:session-factory")(currentExtraction.sessionID);
        }
      });

      bindService.bindGlobalService<MinimalResponseHandler>("current-response-handler").toDynamicValue(context => {
        let currentExtraction = context.container.get<MinimalRequestExtraction>("core:unifier:current-extraction");

        return context.container.get<MinimalResponseHandler>(currentExtraction.component.name + ":current-response-handler");
      });

      bindService.bindGlobalService<ResponseFactory>("current-response-factory").to(ResponseFactoryImpl);

      bindService.bindGlobalService<EntityDictionary>("current-entity-dictionary").to(EntityDictionaryImpl);

      bindService.bindExecutable(componentInterfaces.sessionEndedCallback, SessionEndedCallback);
    }
  }
};