import httpProxy from "http-proxy";
import { IncomingMessage, ServerResponse } from "http";
import { srvs } from "./services";
import { kisaIpfs } from "./app";

export default function register() {
  const { settings } = srvs;
  const { ipfsServer } = settings;
  const proxy = httpProxy.createProxyServer();
  const proxyIpfs = async (req: IncomingMessage, res: ServerResponse) => {
    proxy.web(req, res, {
      target: ipfsServer,
    });
  };
  // kisaIpfs.handlers.add = async (ctx) => {};
  // kisaIpfs.handlers.cat = async (ctx) => {};
  // kisaIpfs.handlers.get = async (ctx) => {};
  kisaIpfs.handlers.blockGet = async (ctx) => proxyIpfs(ctx.req, ctx.res);
  kisaIpfs.handlers.blockPut = async (ctx) => proxyIpfs(ctx.req, ctx.res);
  kisaIpfs.handlers.blockStat = async (ctx) => proxyIpfs(ctx.req, ctx.res);
  kisaIpfs.handlers.dagGet = async (ctx) => proxyIpfs(ctx.req, ctx.res);
  kisaIpfs.handlers.dagPut = async (ctx) => proxyIpfs(ctx.req, ctx.res);
  kisaIpfs.handlers.dagResolve = async (ctx) => proxyIpfs(ctx.req, ctx.res);
  kisaIpfs.handlers.objectData = async (ctx) => proxyIpfs(ctx.req, ctx.res);
  kisaIpfs.handlers.objectGet = async (ctx) => proxyIpfs(ctx.req, ctx.res);
  kisaIpfs.handlers.objectPut = async (ctx) => proxyIpfs(ctx.req, ctx.res);
  kisaIpfs.handlers.objectStat = async (ctx) => proxyIpfs(ctx.req, ctx.res);
  kisaIpfs.handlers.version = async (ctx) => proxyIpfs(ctx.req, ctx.res);
}
