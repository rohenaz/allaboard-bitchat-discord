import { head } from "lodash";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { FetchStatus } from "../../utils/common";
import { useLocalStorage } from "../../utils/storage";
import { useHandcash } from "../handcash";
import { BAP } from "bsv-bap";
import { PrivateKey, PublicKey, Hash } from "@bsv/sdk";

const BapContext = React.createContext(undefined);

const BapProvider = (props) => {
  const [identity, setIdentity] = useLocalStorage(idStorageKey);
  const [decIdentity, setDecIdentity] = useState();
  const [bapProfile, setBapProfile] = useLocalStorage(profileStorageKey);
  const [bapProfileStatus, setBapProfileStatus] = useState(FetchStatus.Loading);
  const [loadIdentityStatus, setLoadIdentityStatus] = useState(
    FetchStatus.Idle
  );
  const { authToken, hcEncrypt, hcDecrypt, decryptStatus } = useHandcash();
  const dispatch = useDispatch();

  useEffect(() => {
    const fire = async () => {
      let id;
      if (authToken) {
        id = await hcDecrypt(identity);
      } else {
        return;
      }
      let bapId = new BAP(id.xprv);
      if (id.ids) {
        bapId.importIds(id.ids);
      }
      let bid = head(bapId.listIds());
      id.bapId = bid;
      setDecIdentity(id);
    };

    if (identity && decryptStatus === FetchStatus.Idle && !decIdentity) {
      fire();
    }
  }, [
    dispatch,
    identity,
    hcDecrypt,
    decryptStatus,
    decIdentity,
    setDecIdentity,
  ]);

  const isValidIdentity = useCallback((decryptedIdString) => {
    const decIdentity = JSON.parse(decryptedIdString);

    let bapId;
    try {
      bapId = new BAP(decIdentity.xprv);
    } catch (e) {
      console.error(e);
      return false;
    }
    if (bapId && decIdentity.ids) {
      bapId.importIds(decIdentity.ids);
    } else {
      return false;
    }

    const ids = bapId.listIds();
    const idy = bapId.getId(ids[0]);

    if (!idy) {
      return false;
    }
    return true;
  }, []);

  const onFileChange = useCallback(
    async (e) => {
      /*Selected files data can be collected here.*/
      console.log(e.target.files);
      setLoadIdentityStatus(FetchStatus.Loading);
      // const encryptedData = localStorage.getItem("bitchat-nitro._bapid");

      const file = head(e.target.files);
      const text = await toText(file);

      if (!isValidIdentity(text)) {
        console.log("error: invalid identity file");
        setLoadIdentityStatus(FetchStatus.Error);
        return;
      }

      try {
        // console.log({ text, authToken });
        // encrypt the uploaded file and store it locally
        if (authToken) {
          // handcash
          const encryptedData = await hcEncrypt(JSON.parse(text));
          // console.log({ encryptedData });
          setIdentity(encryptedData);
        } else {
          // TODO: Handle encrypt / decrypt with panda
          alert("ToDo: Handle encrypt / decrypt with panda");
          return;
          // const { encryptedData } = await relayEncrypt(JSON.parse(text));
          // setIdentity(encryptedData);
        }
        setLoadIdentityStatus(FetchStatus.Success);
      } catch (e) {
        setLoadIdentityStatus(FetchStatus.Error);
      }
    },
    [loadIdentityStatus, isValidIdentity, authToken, hcEncrypt, setIdentity]
  );

  const getIdentity = useCallback(async () => {
    if (bapProfile) {
      return bapProfile;
    }
    setBapProfileStatus(FetchStatus.Loading);
    console.log("get identity");

    const payload = {
      idKey: ``,
    };
    const res = await fetch(`https://bap-api.com/v1/getIdentity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const resp = { idKey: "something" };
    setBapProfileStatus(FetchStatus.Success);
    setBapProfile(resp);
    return resp;
  }, [bapProfileStatus, bapProfile]);

  const value = useMemo(
    () => ({
      identity,
      setIdentity,
      decIdentity,
      setDecIdentity,
      getIdentity,
      bapProfileStatus,
      bapProfile,
      onFileChange,
      loadIdentityStatus,
    }),
    [
      identity, // encrypted identity file
      getIdentity,
      decIdentity,
      setDecIdentity,
      bapProfileStatus,
      setIdentity,
      onFileChange,
      bapProfile,
      loadIdentityStatus,
    ]
  );

  return (
    <>
      <BapContext.Provider value={value} {...props} />
    </>
  );
};

const useBap = () => {
  const context = useContext(BapContext);
  if (context === undefined) {
    throw new Error("useBap must be used within an BapProvider");
  }
  return context;
};

export { BapProvider, useBap };

//
// Utils
//

const idStorageKey = "nitro__BapProvider_id";
const profileStorageKey = "nitro__BapProvider_profile";

const toText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
