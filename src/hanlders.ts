import { decodeAddress, signatureVerify } from "@polkadot/util-crypto";
import jwt from "jsonwebtoken";
import { u8aToHex, BN } from "@polkadot/util";
import { srvs } from "./services";
import _ from "lodash";
import { kisa } from "./app";

export default function register() {
  const { errs, sub } = srvs;
  const makeSignedMessage = _.template(srvs.settings.signedMessage);
  kisa.handlers.nonce = async (ctx) => {
    const { address } = ctx.kisa.query;
    const publicKey = addressToPubkey(address);
    if (!publicKey) throw errs.ErrAddress.toError();
    const nonce = await srvs.redis.getAdressNonce(address);
    ctx.body = { nonce };
  };
  kisa.handlers.login = async (ctx) => {
    const { address, signature } = ctx.kisa.body;
    const publicKey = addressToPubkey(address);
    if (!publicKey) throw errs.ErrAddress.toError();
    const nonce = await srvs.redis.getAdressNonce(address);
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
  // kisa.handlers.upload = async (ctx) => {};
}

function addressToPubkey(address: string): string {
  try {
    const publicKey = decodeAddress(address);
    return u8aToHex(publicKey);
  } catch {}
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
