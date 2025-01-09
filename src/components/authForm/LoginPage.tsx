import type { FC, CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type SocialProfile as BaseSocialProfile,
  useYoursWallet,
  YoursIcon,
} from 'yours-wallet-provider';
import { HANDCASH_API_URL } from '../../config/env';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { useAppDispatch } from '../../hooks';
import { loadChannels } from '../../reducers/channelsReducer';
import { setYoursUser } from '../../reducers/sessionReducer';
import HandcashIcon from '../icons/HandcashIcon';
import Layout from './Layout';

interface ExtendedProfile extends BaseSocialProfile {
  paymail?: string;
  displayName: string;
  avatar: string;
}

export const LoginPage: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    isReady,
    isConnected,
    connect,
    getSocialProfile: getWalletProfile,
  } = useYoursWallet();
  const { getSocialProfile, getAddresses } = useYours();
  const { setAuthToken, profile, getProfile } = useHandcash();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [pandaAuth, setPandaAuth] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('authToken')) {
      const token = searchParams.get('authToken');
      if (token) {
        setAuthToken(token);
        getProfile();
      }
    }
  }, [getProfile, setAuthToken]);

  useEffect(() => {
    if (profile || pandaAuth) {
      dispatch(loadChannels()).then(() => {
        navigate('/channels/nitro');
      });
    }
  }, [dispatch, navigate, profile, pandaAuth]);

  const handleHandcashLogin = () => {
    window.location.href = `${HANDCASH_API_URL}/hcLogin`;
  };

  const handleYoursLogin = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (!isReady) {
        window.open(
          'https://chromewebstore.google.com/detail/yours-wallet/mlbnicldlpdimbjdcncnklfempedeipj',
          '_blank',
        );
        return;
      }

      const connected = await isConnected();
      if (!connected) {
        await connect();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const isNowConnected = await isConnected();
      if (!isNowConnected) {
        throw new Error('Failed to connect to Yours wallet. Please try again.');
      }

      let profile: ExtendedProfile | null = null;
      let addresses = null;

      try {
        const walletProfile = await getWalletProfile();
        if (walletProfile?.displayName) {
          profile = walletProfile as ExtendedProfile;
        }
      } catch (err) {
        // Ignore error and try next method
      }

      if (!profile?.paymail) {
        const contextProfile = await getSocialProfile();
        if (contextProfile?.displayName) {
          profile = contextProfile as ExtendedProfile;
        }
      }

      addresses = await getAddresses();

      if (!profile?.paymail) {
        const displayName = profile?.displayName || 'Anonymous';
        const safeName = displayName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 10);
        const randomSuffix = Math.random().toString(36).slice(2, 7);
        profile = {
          paymail: `${safeName}${randomSuffix}@yours.org`,
          displayName: displayName,
          avatar: '',
        } as ExtendedProfile;
      }

      if (!profile?.paymail) {
        throw new Error('Failed to get or generate paymail.');
      }

      dispatch(
        setYoursUser({
          paymail: profile.paymail,
          address: addresses.bsvAddress,
        }),
      );

      setPandaAuth(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login process failed');
      setPandaAuth(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout heading="Welcome to BitChat">
      <div className="flex flex-col gap-4 w-full">
        <button
          onClick={handleHandcashLogin}
          disabled={isLoading}
          className="btn btn-success w-full text-base-100 gap-2 min-h-12 h-auto py-3"
          style={{
            backgroundColor: "#2fac69",
            "--btn-success-hover": "#08a350",
          } as CSSProperties}
        >
          <HandcashIcon className="w-4 h-4" />
          Login with Handcash
        </button>
        <button
          onClick={handleYoursLogin}
          disabled={!isReady || isLoading}
          className="btn btn-ghost w-full gap-2 min-h-12 h-auto py-3 bg-opacity-25 hover:bg-opacity-10"
          style={{
            backgroundColor: "rgb(154, 224, 133)",
            color: "rgb(154, 224, 133)",
          }}
        >
          <YoursIcon size={"1rem"} />
          {isLoading ? 'Connecting...' : 'Login with Yours Wallet'}
        </button>
      </div>
      {error && (
        <div className="alert alert-error mt-4 text-sm">
          <span>{error}</span>
        </div>
      )}
      <div className="mt-8 text-sm text-center space-y-2">
        <div>
          Need an account?{' '}
          <a
            href="https://chromewebstore.google.com/detail/yours-wallet/mlbnicldlpdimbjdcncnklfempedeipj"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary"
          >
            Register
          </a>
        </div>
        <div>
          <a href="/channels" className="link link-primary">
            Continue as guest (read only)
          </a>
        </div>
      </div>
    </Layout>
  );
};
