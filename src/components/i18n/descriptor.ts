import { ComponentDescriptor, Hooks } from "ioc-container";
import { I18nextWrapper } from "./wrapper";
import { I18n } from "i18next";
import { TranslateHelper } from "./interfaces";
import { TranslateHelper as TranslateHelperImpl } from "./translate-helper";
import { I18nContext } from "./context";

export const descriptor: ComponentDescriptor = {
  name: "i18n",
  bindings: {
    root: (bindService, lookupService) => {
      bindService.bindGlobalService<I18nextWrapper>("wrapper").to(I18nextWrapper).inSingletonScope();
      bindService.bindGlobalService<I18n>("instance").toDynamicValue(context => {
        return context.container.get<I18nextWrapper>("i18n:wrapper").instance;
      });
    },
    request: (bindService, lookupService) => {
      bindService.bindGlobalService<TranslateHelper>("current-helper").to(TranslateHelperImpl);
      bindService.bindGlobalService<I18nContext>("current-context").to(I18nContext).inSingletonScope();

      // Hook into beforeIntent and save current state and current intent into I18nContext (see above)
      // Since I18nContext is a singleton in request scope, it will be the same context instance for this request.
      bindService.bindExtension<Hooks.Hook>(lookupService.lookup("core:state-machine").getInterface("beforeIntent")).toDynamicValue(context => {
        return (success, failure, mode, state, stateName, intent) => {
          let currentI18nContext = context.container.get<I18nContext>("i18n:current-context");
          currentI18nContext.intent = intent;
          currentI18nContext.state = stateName.charAt(0).toLowerCase() + stateName.slice(1);
          success(currentI18nContext);
        };
      });
    }
  }
};