import { BAP } from 'bsv-bap';
import { head } from 'lodash';
import {
  type FC,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';
import type { UnknownAction } from '@reduxjs/toolkit';
import { useYoursWallet } from 'yours-wallet-provider';
import { login } from '../../reducers/sessionReducer';
import { FetchStatus } from '../../utils/common';
import { useLocalStorage } from '../../utils/storage';
import { useHandcash } from '../handcash';

interface BapContextValue {
  identity: string | null;
  decIdentity: DecryptedIdentity | null;
  bapProfile: BapProfile | null;
  bapProfileStatus: FetchStatus;
  loadIdentityStatus: FetchStatus;
  decryptStatus: FetchStatus;
  pandaAuth: boolean;
  setPandaAuth: Dispatch<SetStateAction<boolean>>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

interface DecryptedIdentity {
  xprv: string;
  ids?: { idKey: string }[];
  bapId?: string;
}

interface BapProfile {
  id: string;
  name?: string;
  avatar?: string;
}

type BapIdentities = Record<string, string>;

const BapContext = createContext<BapContextValue | undefined>(undefined);
const profileStorageKey = 'nitro__BapProvider_profile';
const identityStorageKey = 'bitchat-nitro._bapid';
export const BapProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [identity, setIdentity] = useLocalStorage<string>(identityStorageKey);
  const [decIdentity, setDecIdentity] = useState<DecryptedIdentity | null>(null);
  const [bapProfile, setBapProfile] = useState<BapProfile | null>(null);
  const [bapProfileStatus, setBapProfileStatus] = useState<FetchStatus>(
    FetchStatus.Loading,
  );
  const [loadIdentityStatus, setLoadIdentityStatus] = useState<FetchStatus>(
    FetchStatus.Idle,
  );
  const [pandaAuth, setPandaAuth] = useState<boolean>(false);
  const { authToken, hcDecrypt, decryptStatus } = useHandcash();
  const { isConnected } = useYoursWallet();
  const dispatch = useDispatch();

  // Handle identity decryption using the appropriate wallet
  useEffect(() => {
    const decryptIdentity = async () => {
      let id: DecryptedIdentity | undefined;
      try {
        // Check if we're using Handcash for decryption
        if (authToken && identity && typeof hcDecrypt === 'function') {
          console.log('Decrypting identity with Handcash');
          id = await hcDecrypt(identity) as DecryptedIdentity;
        } else if (await isConnected()) {
          console.log('Using Yours wallet for identity');
          // For Yours wallet, the identity is stored unencrypted
          id = identity ? JSON.parse(identity) as DecryptedIdentity : undefined;
        } else {
          console.log('Using raw identity (no wallet)');
          id = identity ? JSON.parse(identity) as DecryptedIdentity : undefined;
        }

        if (!id) {
          console.log('No identity found');
          return;
        }

        console.log('Creating BAP instance from identity');
        const bapId = new BAP(id.xprv);
        if (id.ids) {
          console.log('Importing IDs:', id.ids);
          const identities: BapIdentities = {};
          id.ids.forEach((i) => {
            identities[i.idKey] = i.idKey;
          });
          bapId.importIds(identities as any);
        }
        const bid = head(bapId.listIds());
        if (bid) {
          console.log('Found BAP ID:', bid);
          const updatedId = { ...id, bapId: bid };
          setDecIdentity(updatedId);
          // Instead of setting BAP ID directly, update the session with the current wallet and BAP ID
          if (authToken) {
            dispatch(login({ wallet: 'handcash', authToken, bapId: bid }) as any);
          } else {
            dispatch(login({ wallet: 'yours', bapId: bid }) as any);
          }
        } else {
          console.log('No BAP ID found in identity');
        }
      } catch (error) {
        console.error('Failed to process identity:', error);
      }
    };

    if (identity && decryptStatus === FetchStatus.Idle && !decIdentity) {
      decryptIdentity();
    }
  }, [
    identity,
    hcDecrypt,
    decryptStatus,
    decIdentity,
    authToken,
    dispatch,
    isConnected,
  ]);

  const isValidIdentity = useCallback((decryptedIdString: string) => {
    try {
      const decIdentity = JSON.parse(decryptedIdString) as DecryptedIdentity;
      let bapId: BAP;
      try {
        bapId = new BAP(decIdentity.xprv);
      } catch (e) {
        console.error('Failed to create BAP instance:', e);
        return false;
      }

      if (bapId && decIdentity.ids) {
        const identities: BapIdentities = {};
        decIdentity.ids.forEach((i) => {
          identities[i.idKey] = i.idKey;
        });
        debugger;
        bapId.importIds(identities as any);
      } else {
        console.log('No IDs to import');
        return false;
      }

      const ids = bapId.listIds();
      const idy = bapId.getId(ids[0]);

      if (!idy) {
        console.log('No valid ID found');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to validate identity:', error);
      return false;
    }
  }, []);

  const onFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      setLoadIdentityStatus(FetchStatus.Loading);
      try {
        const file = event.target.files?.[0];
        if (!file) {
          throw new Error('No file selected');
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
              throw new Error('Invalid file content');
            }

            if (!isValidIdentity(text)) {
              throw new Error('Invalid identity file');
            }

            // Store the identity file in localStorage            setIdentity(text);
            setLoadIdentityStatus(FetchStatus.Success);
          } catch (error) {
            console.error('Failed to process identity file:', error);
            setLoadIdentityStatus(FetchStatus.Error);
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('Failed to read identity file:', error);
        setLoadIdentityStatus(FetchStatus.Error);
      }
    },
    [isValidIdentity],
  );

  const value = useMemo(
    () => ({
      identity,
      decIdentity,
      bapProfile,
      bapProfileStatus,
      loadIdentityStatus,
      decryptStatus,
      pandaAuth,
      setPandaAuth,
      onFileChange,
    }),
    [
      identity,
      decIdentity,
      bapProfile,
      bapProfileStatus,
      loadIdentityStatus,
      decryptStatus,
      pandaAuth,
      onFileChange,
    ],
  );

  return <BapContext.Provider value={value}>{children}</BapContext.Provider>;
};

export const useBap = () => {
  const context = useContext(BapContext);
  if (context === undefined) {
    throw new Error('useBap must be used within a BapProvider');
  }
  return context;
};
