import { interfaces as inversifyInterfaces } from "inversify";
import { Component, ComponentDescriptor } from "inversify-components";
import { RedisClient } from "redis";

import { componentInterfaces, Configuration } from "./private-interfaces";
import { Session as SessionInterface } from "./public-interfaces";
import { Session } from "./session";

const defaultConfiguration: Configuration.Defaults = {
  sessionStorage: { factoryName: "platform" },
};

export const descriptor: ComponentDescriptor<Configuration.Defaults> = {
  defaultConfiguration,
  interfaces: componentInterfaces,
  name: "core:services",
  bindings: {
    root: bindingService => {
      bindingService.bindGlobalService<inversifyInterfaces.Factory<SessionInterface>>("session-factory").toFactory<SessionInterface>(context => {
        return (sessionID: string) => {
          const redisInstance = context.container.get<RedisClient>("core:services:redis-instance");
          const configuration = context.container.get<Component<Configuration.Runtime>>("meta:component//core:services").configuration;
          return new Session(sessionID, redisInstance, configuration.maxLifeTime);
        };
      });
    },
  },
};
