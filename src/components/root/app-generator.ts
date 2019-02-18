import { Container, MainApplication } from "inversify-components";
import { componentInterfaces } from "./private-interfaces";
import { CLIGeneratorExtension } from "./public-interfaces";

import * as fs from "fs";

// This class is the main application thread. Therefore it acts like a singleton!
export class GeneratorApplication implements MainApplication {
  private baseDir: string;
  private buildNr!: number;
  private buildDir!: string;
  private container!: Container;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  public async execute(container: Container): Promise<void> {
    this.container = container;
    this.buildNr = Date.now();
    this.buildDir = this.baseDir + "/" + this.buildNr;

    // Create directory for current build
    fs.mkdirSync(this.buildDir);

    // Get and execute all builders
    const builders = this.container.inversifyInstance.getAll<CLIGeneratorExtension>(componentInterfaces.generator);
    await Promise.all(builders.map(builder => Promise.resolve(builder.execute(this.buildDir))));
  }
}
