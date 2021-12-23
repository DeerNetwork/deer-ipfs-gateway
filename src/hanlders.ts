import { decodeAddress, signatureVerify } from "@polkadot/util-crypto";
import jwt from "jsonwebtoken";
import { u8aToHex, BN } from "@polkadot/util";
import { srvs } from "./services";
import _ from "lodash";
import { kisa } from "./app";

export default function register() {
  const { errs, sub, redis, statistic } = srvs;
  const makeSignedMessage = _.template(srvs.settings.signedMessage);
  kisa.handlers.getNonce = async (ctx) => {
    const { address: rawAddress } = ctx.kisa.query;
    let address: string;
    try {
      address = sub.normalizeAddress(rawAddress);
    } catch {
      throw errs.ErrAddress.toError();
    }
    if (!address) throw errs.ErrAddress.toError();
    const nonce = await srvs.redis.getNonce(address);
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
    const nonce = await srvs.redis.getNonce(address);
    const signedMessage = makeSignedMessage({ nonce });
    if (!signatureVerify(signedMessage, signature, publicKey).isValid) {
      throw errs.ErrSignature.toError();
    }
    const balance = await sub.balanceOf(address);
    if (balance.eq(new BN(0))) {
      throw errs.ErrBalance.toError();
    }
    ctx.body = makeJwt(address);
  };
  kisa.handlers.getStatistic = async (ctx) => {
    const { address } = ctx.state.auth;
    const { incomes, outcomes } = await statistic.mustGet(address);
    ctx.body = { incomes, outcomes };
  };
}

function addressToPubkey(address: string): string {
  const publicKey = decodeAddress(address);
  return u8aToHex(publicKey);
}

function makeJwt(address: string) {
  const { tokenExpiresIn, tokenSecret } = srvs.settings;
  const token: string = jwt.sign(
    {
      address,
    },
    tokenSecret,
    {
      expiresIn: tokenExpiresIn,
    }
  );
  return {
    address,
    token,
    expireAt: Date.now() + tokenExpiresIn * 1000,
  };
}
