import { decodeAddress, signatureVerify } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";
import { Middleware } from "kisa";
import _ from "lodash";
import { srvs } from "./services";

export default function auth(): Middleware {
  return async (ctx, next) => {
    const fail = (message: string) => {
      ctx.status = 401;
      ctx.body = { Error: message };
    };
    const authorization = ctx.headers.authorization;
    if (!authorization) {
      return fail("No Authorization");
    }
    const [kind, value] = authorization.split(" ");
    if (kind !== "Basic" || !value) {
      return fail("Invalid Authorization");
    }
    const credential = Buffer.from(value, "base64").toString();
    const [address, signature] = credential.split(":");
    if (!address || !signature) {
      return fail("Invalid Authorization");
    }
    const publicKey = addressToPubkey(address);
    if (!publicKey) {
      return fail("Invalid Authorization Address");
    }
    const nonce = await srvs.redis.getAdressNonce(address);
    const signedMessage = _.template(srvs.settings.signedMessage)({ nonce });
    if (!signatureVerify(signedMessage, signature, publicKey).isValid) {
      return fail("Invalid Authorization Signature");
    }
    next();
  };
}

function addressToPubkey(address: string): string {
  try {
    const publicKey = decodeAddress(address);
    return u8aToHex(publicKey);
  } catch {}
}
