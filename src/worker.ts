import { handle, type Env } from "./app";

// The Workers entry module may only export handlers, so app logic lives in ./app.
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handle(request, env);
  },
};
