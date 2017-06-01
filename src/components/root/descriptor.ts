import { ComponentDescriptor } from "ioc-container";
import { GenericRequestHandler } from "./generic-request-handler";
import { componentInterfaces } from "./interfaces";

export const descriptor: ComponentDescriptor = {
  name: "core:root",
  interfaces: componentInterfaces,
  bindings: {
    root: (bindService) => {
      bindService.bindLocalServiceToSelf(GenericRequestHandler);
    }
  }
};