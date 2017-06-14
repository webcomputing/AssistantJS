import { Container } from "ioc-container";
import { Configuration } from "../../../src/components/i18n/interfaces";
import * as i18next from "i18next";

export function configureI18nLocale(container: Container, debug = false, localePath = __dirname + "/../mocks/i18n/locale/{{lng}}/{{ns}}.json", instance = i18next.createInstance()) {
  let config: Configuration = {
    i18nextInstance: instance,
    i18nextAdditionalConfiguration: {
      debug: debug,
      preload: ["de"],
      lng: "de",
      fallbackLng: "de",
      defaultNS: "translation",
      backend: {
        loadPath: localePath,
        jsonIndent: 2
      },
      initImmediate: false
    }
  };
  container.componentRegistry.lookup("core:i18n").addConfiguration(config);
}