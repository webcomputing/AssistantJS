import { injectable } from "inversify";
import { LocalesLoader } from "../../../../src/assistant-source";

@injectable()
export class LocalesLoaderMock implements LocalesLoader {
  public getUtteranceTemplates() {
    return {};
  }

  public getCustomEntities() {
    return {
      en: {
        color: [
          {
            value: "green",
            synonyms: ["forest", "sage", "olive", "lime", "jade", "mint"],
          },
          {
            value: "red",
            synonyms: ["scarlett", "salmon", "carmine", "maroon", "ruby", "crimson"],
          },
          {
            value: "yellow",
            synonyms: ["canary", "flaxen", "corn", "bumblebee", "amber", "blonde"],
          },
          {
            value: "orange",
          },
        ],
      },
    };
  }
}
