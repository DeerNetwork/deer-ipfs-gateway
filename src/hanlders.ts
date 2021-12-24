import { decodeAddress, signatureVerify } from "@polkadot/util-crypto";
import { v4 as uuidv4 } from "uuid";
import { u8aToHex, BN } from "@polkadot/util";
import { srvs } from "./services";
import _ from "lodash";
import { kisa } from "./app";

export default function register() {
  const { errs, sub, redis, statistic, settings } = srvs;
  const makeSignedMessage = _.template(settings.signedMessage);
  kisa.handlers.getNonce = async (ctx) => {
    const { address: rawAddress } = ctx.kisa.query;
    let address: string;
    try {
      address = sub.normalizeAddress(rawAddress);
    } catch {
      throw errs.ErrAddress.toError();
    }
    if (!address) throw errs.ErrAddress.toError();
    const nonce = await redis.getNonce(address);
    ctx.body = { nonce, address };
  };
  kisa.handlers.login = async (ctx) => {
    const { address: rawAddress, signature } = ctx.kisa.body;
    let address: string;
    let publicKey: string;
    try {
      address = sub.normalizeAddress(rawAddress);
      publicKey = addressToPubkey(address);
    } catch {
      throw errs.ErrAddress.toError();
    }
    if (!address) throw errs.ErrAddress.toError();
    const nonce = await redis.getNonce(address);
    const signedMessage = makeSignedMessage({ nonce });
    if (!signatureVerify(signedMessage, signature, publicKey).isValid) {
      throw errs.ErrSignature.toError();
    }
    const balance = await sub.balanceOf(address);
    if (balance.eq(new BN(0))) {
      throw errs.ErrBalance.toError();
    }
    await redis.incNonce(address);
    const secret = uuidv4();
    const now = Date.now();
    await redis.setex(redis.tokenKey(address), settings.tokenExpiresIn, secret);
    ctx.body = {
      token: `${address}:${secret}`,
      expireAt: now + settings.tokenExpiresIn * 1000,
    };
  };
  kisa.handlers.getStatistic = async (ctx) => {
    const { address } = ctx.state.auth;
    const { incomes, outcomes } = await statistic.getStatistic(address);
    ctx.body = { incomes, outcomes };
  };
}

function addressToPubkey(address: string): string {
  const publicKey = decodeAddress(address);
  return u8aToHex(publicKey);
}
