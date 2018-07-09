import { Filter, State } from "assistant-source";
import { injectable } from "inversify";

/**
 * This is an example filter you could add to a state or intent by adding a '@filter(ExampleFilter)'-decorator to it.
 * Filters are used to evaluate certain criteria which results either in executing the initially called intent method (by returning 'true') or causing a redirect to a more fitting one.
 */
@injectable()
export class ExampleFilter implements Filter {
  public execute(
    state: State.Required,
    stateName: string,
    intentMethod: string,
    ...args: any[]
  ):
    | Promise<{ state: string; intent: string; args?: any[] } | boolean>
    | { state: string; intent: string; args?: any[] }
    | boolean {
    // evaluate criteria
    const redirectNeeded = false;

    if (redirectNeeded) {
      const redirect = {
        state: "StateToRedirectTo",
        intent: "intentMethodToRedirectTo",
        args: ["additional arguments"]
      };

      return redirect;
    }
    return true;
  }
}
