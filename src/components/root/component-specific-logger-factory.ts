import { interfaces as inversifyInterfaces } from "inversify";
import { ComponentSpecificLoggerFactory, Logger } from "./public-interfaces";

export const componentSpecificLoggerFactoryByContainer = (container: inversifyInterfaces.Container): ComponentSpecificLoggerFactory => {
  return (componentName, scope) => {
    if (scope !== "root" && scope !== "request" && typeof scope !== "undefined") {
      throw new Error("Given scope of componentSpecificLoggerFactory must be either 'root' or 'request'!");
    }

    if (container.isBound("core:root:current-logger")) {
      if (typeof scope === "undefined") {
        scope = "request";
      }
    } else {
      if (typeof scope === "undefined") {
        scope = "root";
      } else if (scope === "request") {
        throw new Error("You have to be in request scope before using componentSpecificLoggerFactory with scope === 'request'");
      }
    }

    const logger = scope === "request" ? container.get<Logger>("core:root:current-logger") : container.get<Logger>("core:root:logger");
    return logger.child({ component: componentName });
  };
};
