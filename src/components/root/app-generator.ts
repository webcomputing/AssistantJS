import { Container, MainApplication } from "inversify-components";
import { componentInterfaces } from "./private-interfaces";
import { CLIGeneratorExtension } from "./public-interfaces";

import * as fs from "fs";

// This class is the main application thread. Therefore it acts like a singleton!
export class GeneratorApplication implements MainApplication {
  constructor(private baseDir: string, private buildTimeStamp: number) {}

  public async execute(container: Container): Promise<void> {
    const buildDir = `${this.baseDir}/${this.buildTimeStamp}`;

    // Create directory for current build
    fs.mkdirSync(buildDir);

    // Get and execute all builders
    const builders = container.inversifyInstance.getAll<CLIGeneratorExtension>(componentInterfaces.generator);
    await Promise.all(builders.map(builder => Promise.resolve(builder.execute(buildDir))));
  }
}
