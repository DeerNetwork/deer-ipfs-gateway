import useKisa, { App, Router, HandleValidateError, State } from "kisa";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { srvs } from "./services";
import auth, { parseBasicToken } from "./middlewares/auth";
import error from "./middlewares/error";
import * as Api from "./generated/api";
import * as ApiIpfs from "./generated/apiIpfs";
import * as ApiInner from "./generated/apiInner";
import register from "./hanlders";
import registerIpfs from "./handlersIpfs";
import registerInner from "./handlersInner";

export interface AppState {
  auth?: {
    address: string;
  };
}

const handleValidateError: HandleValidateError = (ctx, errors) => {
  throw srvs.errs.ErrValidation.toError({ extra: errors });
};

const [kisa, mountKisa] = useKisa<
  AppState,
  Api.Handlers<AppState>,
  Api.SecurityHandlers<AppState>
>({
  prefix: "/",
  operations: Api.OPERATIONS,
  errorHandlers: {
    validate: handleValidateError,
  },
  securityHandlers: {
    auth: (_) => auth("auth", parseBasicToken),
  },
});

const [kisaIpfs, mountKisaIpfs] = useKisa<
  AppState,
  ApiIpfs.Handlers<AppState>,
  Api.SecurityHandlers<AppState>
>({
  prefix: "/api/v0/",
  operations: ApiIpfs.OPERATIONS,
  errorHandlers: {
    validate: handleValidateError,
  },
  securityHandlers: {
    auth: (_) => auth("auth", parseBasicToken),
  },
});

const [kisaInner, mountKisaInner] = useKisa<State, ApiInner.Handlers<State>>({
  prefix: "/_/",
  operations: ApiInner.OPERATIONS,
  hook: async (ctx, operation) => {
    if (srvs.settings.prod && operation.xProps["x-debug"]) {
      throw srvs.errs.ErrDebugOnly.toError();
    }
  },
  errorHandlers: {
    validate: handleValidateError,
  },
});

export { kisa, kisaIpfs, kisaInner };

export default function createApp() {
  register();
  registerIpfs();
  registerInner();

  const app = new App();
  const router = new Router();
  app.use(error());
  app.use(
    cors({
      origin: "*",
      allowHeaders: "*",
    })
  );
  app.use(
    bodyParser({
      enableTypes: ["json"],
      onerror: () => {
        throw srvs.errs.ErrValidation.toError();
      },
    })
  );
  mountKisa(router);
  mountKisaIpfs(router);
  mountKisaInner(router);
  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
}
