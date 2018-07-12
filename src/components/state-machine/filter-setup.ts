import * as fs from "fs";
import { ComponentDescriptor } from "inversify-components";

import { Filter } from "./public-interfaces";

import { AssistantJSSetup } from "../../setup";

import { Constructor } from "../../assistant-source";
import { ConventionalFileLoader } from "./conventional-file-loader";

export class FilterSetup extends ConventionalFileLoader<Filter> {
  /**
   * [Sync!] Registers all filters file by name / directory structure convention
   * @param addOnly If set to true, only adds all filter classes to internal hash, but doesn't register them with component descriptor
   * @param baseDirectory Base directory to start (process.cwd() + "/js/app")
   * @param dictionary Dictionary which contains the filters to add, defaults to "/filters"
   */
  public registerByConvention(addOnly = false, baseDirectory = process.cwd() + "/js/app", dictionary = "/filters") {
    if (fs.existsSync(baseDirectory + dictionary)) {
      return super.registerByConvention(addOnly, baseDirectory, dictionary);
    }
  }

  /** Builds a component descriptor out of all added filters */
  public toComponentDescriptor(): ComponentDescriptor {
    return {
      name: "core:state-machine:current-filters",
      bindings: {
        // tslint:disable-next-line:no-empty
        root: () => {},
        request: (bindService, lookupService) => {
          const filterInterface = lookupService.lookup("core:state-machine").getInterface("filter");

          Object.keys(this.classes).forEach(filterName => {
            const binding = bindService.bindExtension<Filter>(filterInterface).to(this.classes[filterName]);
          });
        },
      },
    };
  }

  /**
   * Adds a filter to setup
   * @param filterClass Filter class to add to setup
   * @return Name of class which was added
   */
  public addFilter(filterClass: Constructor<Filter>) {
    return this.addClass(filterClass);
  }

  /** Registers all filters in dependency injection container */
  public registerFilters() {
    return this.registerClasses();
  }
}
