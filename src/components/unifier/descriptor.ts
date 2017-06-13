import { ComponentDescriptor, BindingDescriptor } from "ioc-container";
import { interfaces as inversifyInterfaces } from "inversify";

import { DestroyableSession } from "../services/interfaces";
import { ContextDeriver as ContextDeriverI } from "../root/interfaces";
import { ContextDeriver } from "./context-deriver";
import { componentInterfaces, MinimalRequestExtraction, OptionalConfiguration } from "./interfaces";

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
    },

    request: (bindService) => {
      bindService.bindGlobalService<inversifyInterfaces.Factory<DestroyableSession>>("current-session-factory").toFactory<DestroyableSession>(context => {
        return ()  => {
          let currentExtraction = context.container.get<MinimalRequestExtraction>("core:unifier:current-extraction");

          return context.container.get<inversifyInterfaces.Factory<DestroyableSession>>("core:services:session-factory")(currentExtraction.sessionID);
        }
      });
    }
  }
};