import { interfaces as inversifyInterfaces } from "inversify";
import { Component, ComponentDescriptor } from "inversify-components";

import { BeforeResponseHandler } from "../../assistant-source";
import { KillSessionService } from "./kill-session-service";
import { componentInterfaces, Configuration } from "./private-interfaces";
import { CurrentSessionFactory, Session, SessionFactory } from "./public-interfaces";
import { CryptedPlatformSessionFactory } from "./session-factories/crypted-platform-session-factory";
import { PlatformSessionFactory } from "./session-factories/platform-session-factory";
import { PlatformSessionMirror } from "./session-factories/platform-session-mirror";
import { RedisSessionFactory } from "./session-factories/redis-session-factory";

const defaultConfiguration: Configuration.Defaults = {
  // Set default session storage to "platform". This way, we don't have any dependencies.
  sessionStorage: { factoryName: "platform" },
};

export const descriptor: ComponentDescriptor<Configuration.Defaults> = {
  defaultConfiguration,
  interfaces: componentInterfaces,
  name: "core:services",
  bindings: {
    // tslint:disable-next-line:no-empty
    root: bindingService => {},

    request: (bindService, lookupService) => {
      // Bind all AssistantJS session storages
      bindService
        .bindExtension<SessionFactory>(componentInterfaces.currentSessionFactory)
        .to(RedisSessionFactory)
        .whenTargetNamed("redis");
      bindService
        .bindExtension<SessionFactory>(componentInterfaces.currentSessionFactory)
        .to(PlatformSessionFactory)
        .whenTargetNamed("platform");
      bindService
        .bindExtension<SessionFactory>(componentInterfaces.currentSessionFactory)
        .to(CryptedPlatformSessionFactory)
        .whenTargetNamed("cryptedPlatform");

      // Injection to get current session
      bindService.bindGlobalService<CurrentSessionFactory>("current-session-factory").toFactory<Session>(context => {
        return () => {
          const configuration = context.container.get<Component<Configuration.Runtime>>("meta:component//core:services").configuration;

          // Check if there is a session storage factory bound to this name...
          if (context.container.isBoundNamed(componentInterfaces.currentSessionFactory, configuration.sessionStorage.factoryName)) {
            // ... and if so, call getCurrentSession() on it with possible configuration attributes
            return context.container
              .getNamed<SessionFactory>(componentInterfaces.currentSessionFactory, configuration.sessionStorage.factoryName)
              .getCurrentSession("configuration" in configuration.sessionStorage ? configuration.sessionStorage.configuration : undefined);
          }

          throw new Error(
            `Tried to return a session storage of type "${
              configuration.sessionStorage.factoryName
            }", but no named binding was found. If you configured your own session storage implementation, did you also bind it to the correct componentInterface with a named binding?`
          );
        };
      });

      // Bind kill session service
      bindService.bindLocalServiceToSelf(KillSessionService);
      bindService.bindGlobalService("current-kill-session-promise").toProvider(context => {
        return () => {
          const killService = context.container.get(KillSessionService);
          return killService.execute();
        };
      });

      // Bind platform session mirror to componentInterfaces.beforeSendResponse remain in session even if nothing was changed
      bindService.bindExtension<BeforeResponseHandler>(lookupService.lookup("core:unifier").getInterface("beforeSendResponse")).to(PlatformSessionMirror);
    },
  },
};
