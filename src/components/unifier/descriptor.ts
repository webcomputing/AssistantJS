import { ComponentDescriptor, BindingDescriptor } from "ioc-container";

import { ContextDeriver as ContextDeriverI } from "../root/interfaces";
import { ContextDeriver } from "./context-deriver";
import { componentInterfaces } from "./interfaces";

export const descriptor: ComponentDescriptor = {
  name: "core:state-machine",
  interfaces: componentInterfaces,
  bindings: {
    root: (bindService, lookupService) => {
      bindService.bindExtension<ContextDeriverI>(lookupService.lookup("core:root").getInterface("contextDeriver")).to(ContextDeriver);
    }
  }
};