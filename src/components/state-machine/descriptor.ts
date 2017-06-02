import { ComponentDescriptor, BindingDescriptor } from "ioc-container";

import { Runner } from "./runner";
import { componentInterfaces } from "./interfaces";

export const descriptor: ComponentDescriptor = {
  name: "core:unifier",
  interfaces: componentInterfaces,
  bindings: {
    root: (bindService, lookupService) => {
      bindService.bindExecutable(lookupService.lookup("core:root").getInterface("afterContextExtension"), Runner);
    }
  }
};