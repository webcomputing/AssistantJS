import { interfaces as inversifyInterfaces } from "inversify";
import { Component, ComponentDescriptor } from "inversify-components";
import { RedisClient } from "redis";

import { Configuration } from "./private-interfaces";
import { Session as SessionInterface } from "./public-interfaces";
import { Session } from "./session";

const defaultConfiguration: Configuration.Defaults = {
  maxLifeTime: 1800,
};

export const descriptor: ComponentDescriptor<Configuration.Defaults> = {
  name: "core:services",
  defaultConfiguration,
  bindings: {
    root: bindingService => {
      bindingService.bindGlobalService<inversifyInterfaces.Factory<SessionInterface>>("session-factory").toFactory<SessionInterface>(context => {
        return (sessionID: string) => {
          const redisInstance = context.container.get<RedisClient>("core:services:redis-instance");
          const configuration = context.container.get<Component<Configuration.Runtime>>("meta:component//core:services").configuration;
          return new Session(sessionID, redisInstance, configuration.maxLifeTime);
        };
      });

      bindingService.bindGlobalService<RedisClient>("redis-instance").toDynamicValue(context => {
        const component = context.container.get<Component<Configuration.Runtime>>("meta:component//core:services");
        return component.configuration.redisClient;
      });
    },
  },
};
