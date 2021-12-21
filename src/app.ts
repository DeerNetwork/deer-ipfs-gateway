import useKisa, { State, App, Router, HandleValidateError } from "kisa";
import jwt from "jsonwebtoken";
import cors from "@koa/cors";
import helmet from "koa-helmet";
import bodyParser from "koa-bodyparser";
import { srvs } from "./services";
import bearer from "./middlewares/bearer";
import error from "./middlewares/error";
import * as Api from "./generated/api";
import * as ApiIpfs from "./generated/apiIpfs";
import register from "./hanlders";
import registerInner from "./handlersIpfs";

interface ApiState {
  auth?: {
    userId: number;
  };
}

const handleValidateError: HandleValidateError = (ctx, errors) => {
  throw srvs.errs.ErrValidation.toError({ extra: errors });
};

const [kisa, mountKisa] = useKisa<
  ApiState,
  Api.Handlers<ApiState>,
  Api.SecurityHandlers<ApiState>
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

const [kisaIpfs, mountKisaInner] = useKisa<State, ApiIpfs.Handlers<State>>({
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
  app.use(helmet());
  app.use(
    bodyParser({
      enableTypes: ["json"],
      onerror: () => {
        throw srvs.errs.ErrValidation.toError();
      },
    })
  );
  mountKisa(router);
  mountKisaInner(router);
  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
}
