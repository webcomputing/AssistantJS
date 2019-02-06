import * as fs from "fs";
import { Container } from "inversify-components";
import { componentInterfaces } from "./private-interfaces";
import { CLIDeploymentExtension } from "./public-interfaces";

export class DeploymentApplication {
  private container!: Container;

  constructor(private buildDir: string) {
    if (!fs.existsSync(buildDir)) throw new Error("Missing build directory. Maybe the generator has be executed first");
  }

  public async execute(container: Container): Promise<void> {
    // Get all bound deployments and execute them
    const deployments = container.inversifyInstance.getAll<CLIDeploymentExtension>(componentInterfaces.deployments);
    await Promise.all(deployments.map(deployment => Promise.resolve(deployment.execute(this.buildDir))));
  }
}
