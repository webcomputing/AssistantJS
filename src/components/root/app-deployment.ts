import * as fs from "fs";
import { Container } from "inversify-components";
import { componentInterfaces } from "./private-interfaces";
import { CLIDeploymentExtension } from "./public-interfaces";

export class DeploymentApplication {
  constructor(private buildDir: string, private buildTimeStamp: number = Date.now()) {
    if (!fs.existsSync(buildDir)) throw new Error("Missing build directory. Previously you have to execute the generator.");
  }

  public async execute(container: Container): Promise<void> {
    // Get all bound deployments and execute them
    const deployments = container.inversifyInstance.getAll<CLIDeploymentExtension>(componentInterfaces.deployments);
    await Promise.all(deployments.map(async deployment => deployment.execute(`${this.buildDir}/${this.buildTimeStamp}`)));
  }
}
