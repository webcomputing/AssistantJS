import { run } from "../src/setup";
import { ServerApplication } from "../src/components/root/app-server";

export async function withServer() {
  return new Promise(resolve => {
    run(new ServerApplication(() => {
      resolve();
    }));
  });
}