import fs from "fs/promises";
import path from "path";
import _ from "lodash";
import { srvs } from "./services";
import { kisaInner as kisa } from "./app";

export default function register() {
  kisa.handlers.health = async (ctx) => {
    try {
      if (srvs.redis) {
        await srvs.redis.get("key");
      }
      ctx.body = "OK";
    } catch (err) {
      ctx.status = 500;
      ctx.body = err.message;
    }
  };

  const cache = {};
  kisa.handlers.staticFile = async (ctx) => {
    const { name } = ctx.kisa.params;
    const { staticFiles, baseDir } = srvs.settings;
    ctx.set("content-type", "text/plain; charset=utf-8");
    if (cache[name]) {
      ctx.body = cache[name];
      return;
    }
    if (!staticFiles[name]) {
      ctx.status = 404;
      ctx.body = "NOT FOUND";
    }
    try {
      const filePath = path.resolve(baseDir, staticFiles[name]);
      const data = await fs.readFile(filePath, "utf8");
      cache[name] = data;
      ctx.body = data;
    } catch (err) {
      ctx.status = 500;
      ctx.body = err.message;
    }
  };

  kisa.handlers.runSrvs = async (ctx) => {
    const { path, args, ret = true } = ctx.kisa.body;
    const parent = getParent(path);
    const fn = _.get(srvs, path);
    if (!fn) {
      throw new Error(`srvs.${path} miss`);
    }
    const retValue = await fn.apply(_.get(srvs, parent), args);
    if (ret) {
      ctx.body = retValue || "";
    } else {
      ctx.body = "";
    }
  };
}

function getParent(path) {
  const dot = path.lastIndexOf(".");
  const bracket = path.lastIndexOf("]");
  const post = Math.max(dot, bracket);
  if (post > -1) {
    return path.slice(0, dot);
  }
  return path;
}
