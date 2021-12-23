import useKisa, { App, Router, HandleValidateError } from "kisa";
import jwt from "jsonwebtoken";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { srvs } from "./services";
import bearer from "./middlewares/bearer";
import error from "./middlewares/error";
import * as Api from "./generated/api";
import * as ApiIpfs from "./generated/apiIpfs";
import register from "./hanlders";
import registerInner from "./handlersIpfs";

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
  operations: Api.OPERATIONS,
  errorHandlers: {
    validate: handleValidateError,
  },
  securityHandlers: {
    jwt: (_) =>
      bearer("auth", async (token) => {
        return jwt.verify(token, srvs.settings.tokenSecret);
      }),
  },
});

const [kisaIpfs, mountKisaIpfs] = useKisa<
  AppState,
  ApiIpfs.Handlers<AppState>,
  Api.SecurityHandlers<AppState>
>({
  prefix: "/_/",
  operations: ApiIpfs.OPERATIONS,
  errorHandlers: {
    validate: handleValidateError,
  },
  securityHandlers: {
    jwt: (_) =>
      bearer("auth", async (token) => {
        return jwt.verify(token, srvs.settings.tokenSecret);
      }),
  },
});

export { kisa, kisaIpfs };

export default function createApp() {
  register();
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
  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
}
