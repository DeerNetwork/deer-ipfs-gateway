import { ServiceOption, createInitFn } from "use-services";
import { Keyring } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";
import _ from "lodash";
import { sleep } from "./utils";
import { srvs } from "./services";

export type Option = ServiceOption<any, Service>;

export class Service {
  async delay(seconds: number) {
    await sleep(seconds);
  }

  async echo(data: any) {
    return data;
  }

  async sig(suri: string, nonce: number) {
    const keyring = new Keyring({ type: "sr25519" });
    const account = keyring.addFromUri(suri);
    const makeSignedMessage = _.template(srvs.settings.signedMessage);
    const signedMessage = makeSignedMessage({ nonce });
    const data = account.sign(signedMessage);
    return {
      signature: u8aToHex(data),
    };
  }
}

export const init = createInitFn(Service);
