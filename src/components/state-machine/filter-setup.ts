import * as fs from "fs";
import { ComponentDescriptor } from "inversify-components";

import { Filter } from "./public-interfaces";

import { AssistantJSSetup } from "../../setup";

import { Constructor } from "../../assistant-source";
import { ConventionalFileLoader } from "./conventional-file-loader";

export class FilterSetup extends ConventionalFileLoader {
  private filterClasses: { [name: string]: Constructor<Filter> } = {};

  constructor(assistantJS: AssistantJSSetup) {
    super(assistantJS);
  }

  /** Adds a filter to setup */
  public addClass(filterClass: Constructor<Filter>, nameParam?: string) {
    // Add filter class
    const name = typeof nameParam === "undefined" ? FilterSetup.deriveClassName(filterClass) : nameParam;
    this.filterClasses[name] = filterClass;
  }

  /** Builds a component descriptor out of all added filters */
  public toComponentDescriptor(): ComponentDescriptor {
    return {
      name: "core:state-machine:current-filters",
      bindings: {
        root: () => {},
        request: (bindService, lookupService) => {
          const filterInterface = lookupService.lookup("core:state-machine").getInterface("filter");

          Object.keys(this.filterClasses).forEach(filterName => {
            const binding = bindService.bindExtension<Filter>(filterInterface).to(this.filterClasses[filterName]);
          });
        },
      },
    };
  }
}
