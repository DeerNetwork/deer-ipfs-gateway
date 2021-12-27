import path from "path";
import useServices from "use-services";
import * as Winston from "@use-services/winston";
import * as Echo from "@use-services/echo";
import * as IORedis from "@use-services/ioredis";
import * as HttpErr from "@use-services/httperr";
import { mergeJson } from "./utils";
import * as Sub from "./sub";
import * as Statistic from "./statistic";
import * as TaskQ from "./taskq";
import * as Mock from "./mock";
import * as errcodes from "./errcodes";
import Redis from "./redis";

const settings = {
  app: "dg",
  host: "0.0.0.0",
  port: 5050,
  prod: process.env.NODE_ENV === "production",
  baseDir: process.env.BASE_DIR || process.cwd(),
  signedMessage: "login to deer ipfs gateway, nonce=${nonce}",
  ipfsServer: "http://127.0.0.1:5001",
  cors: false,
  tokenExpiresIn: 30 * 24 * 60 * 60,
  staticFiles: {
    api: "api.jsona",
    apiIpfs: "apiIpfs.jsona",
  },
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
  taskq: {
    init: TaskQ.init,
    args: {
      name: "taskq",
    },
  } as TaskQ.Option<TaskQ.Service>,
  sub: {
    init: Sub.init,
    args: {
      url: "ws://localhost:9944",
    },
  } as Sub.Option<Sub.Service>,
  errs: {
    init: HttpErr.init,
    args: errcodes,
  } as HttpErr.Option<typeof errcodes>,
  mock: {
    init: Mock.init,
    args: {},
  } as Mock.Option,
};

mergeJson(options, path.resolve(settings.baseDir, "config.json"));

const { srvs, init } = useServices(settings.app, options);
export { srvs, init };
