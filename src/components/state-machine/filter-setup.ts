import * as fs from "fs";
import { ComponentDescriptor } from "inversify-components";

import { Filter } from "./public-interfaces";

import { AssistantJSSetup } from "../../setup";
import { GenericIntent } from "../unifier/public-interfaces";

export class FilterSetup {
  private assistantJS: AssistantJSSetup;
  private filterClasses: { [name: string]: Filter.Constructor } = {};

  constructor(assistantJS: AssistantJSSetup) {
    this.assistantJS = assistantJS;
  }

  /**
   * [Sync!] Adds all classes in a specific directory as filters.
   * @param addOnly If set to true, this method only calls "addFilter", but not "registerFilters" finally
   * @param baseDirectory Base directory to start (process.cwd() + "/js/app")
   * @param dictionary Dictionary which contains filter classes, defaults to "filters"
   */
  public registerByConvention(addOnly = false, baseDirectory = process.cwd() + "/js/app", dictionary = "/filters") {
    fs.readdirSync(baseDirectory + dictionary).forEach(file => {
      const suffixParts = file.split(".");
      const suffix = suffixParts[suffixParts.length - 1];

      // Load if file is a JavaScript file
      if (suffix !== "js") return;
      const classModule = require(baseDirectory + dictionary + "/" + file);

      Object.keys(classModule).forEach(exportName => {
        this.addFilter(classModule[exportName]);
      });
    });

    if (!addOnly) this.registerFilters();
  }

  /** Adds a filter to setup */
  public addFilter(filterClass: Filter.Constructor, name?: string) {
    // Add filter class
    name = typeof name === "undefined" ? FilterSetup.deriveFilterName(filterClass) : name;
    this.filterClasses[name] = filterClass;
  }

  /** Registers all filters in dependency injection container */
  public registerFilters() {
    this.assistantJS.registerComponent(this.toComponentDescriptor());
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
            const binding = bindService.bindExtension<Filter.Required>(filterInterface).to(this.filterClasses[filterName]);
          });
        },
      },
    };
  }

  /** Returns a filters name based on its constructor */
  public static deriveFilterName(filterClass: Filter.Constructor): string {
    return filterClass.name;
  }
}
