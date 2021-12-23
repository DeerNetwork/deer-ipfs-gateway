import path from "path";
import useServices from "use-services";
import * as Winston from "@use-services/winston";
import * as Echo from "@use-services/echo";
import * as IORedis from "@use-services/ioredis";
import * as HttpErr from "@use-services/httperr";
import { mergeJson } from "./utils";
import * as Sub from "./sub";
import * as Statistic from "./statistic";
import Redis from "./redis";
import * as errcodes from "./errcodes";

const settings = {
  app: "ethsub",
  host: "0.0.0.0",
  port: "5050",
  baseDir: process.env.BASE_DIR || process.cwd(),
  signedMessage: "login to deer network with nonce: ${nonce}",
  ipfsServer: "http://127.0.0.1:5001",
  tokenSecret: "a123456",
  tokenExpiresIn: 7 * 24 * 60 * 60,
};

const options = {
  settings: {
    init: Echo.init,
    args: settings,
  } as Echo.Option<typeof settings>,
  logger: {
    init: Winston.init,
    args: {
      console: {
        level: "debug",
      },
    },
  } as Winston.Option<Winston.Service>,
  redis: {
    init: IORedis.init,
    args: {
      host: "0.0.0.0",
      password: "password",
    },
    ctor: Redis,
  } as IORedis.Option<Redis>,
  statistic: {
    init: Statistic.init,
    args: {
      maxIncomes: 5 * 1024 * 1024 * 1024,
      maxOutcomes: 5 * 1024 * 1024 * 1024,
    },
  } as Statistic.Option<Statistic.Service>,
  sub: {
    init: Sub.init,
    deps: ["store"],
    args: {
      url: "ws://localhost:9944",
    },
  } as Sub.Option<Sub.Service>,
  errs: {
    init: HttpErr.init,
    args: errcodes,
  } as HttpErr.Option<typeof errcodes>,
};

mergeJson(options, path.resolve(settings.baseDir, "config.json"));

const { srvs, init } = useServices(settings.app, options);
export { srvs, init };
