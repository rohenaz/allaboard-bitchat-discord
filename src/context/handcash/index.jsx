import React, { useCallback, useContext, useMemo, useState } from 'react';
import { FetchStatus } from '../../utils/common';
import env from '../../utils/env';
import { lsTest, useLocalStorage } from '../../utils/storage';

const HandcashContext = React.createContext(undefined);

const HandcashProvider = (props) => {
  const [profile, setProfile] = useLocalStorage(profileStorageKey);
  const [authToken, setAuthToken] = useLocalStorage(authTokenStorageKey);
  const [decryptStatus, setDecryptStatus] = useState(FetchStatus.Idle);
  const getProfile = useCallback(async () => {
    // Test localStorage is accessible
    if (!lsTest()) {
      throw new Error('localStorage is not available');
    }

    // if we dont have the paymail, get it
    if (authToken) {
      try {
        const resp = await fetch(`${env.REACT_APP_API_URL}/hcProfile`, {
          method: 'POST',
          headers: {
            'Content-type': 'application/json',
          },
          body: JSON.stringify({ authToken }),
        });
        const { publicProfile } = await resp.json();
        // console.log({ publicProfile });
        setProfile(publicProfile);
        return publicProfile;
      } catch (e) {
        console.error(e);
        return;
      }
    }
  }, [authToken, setProfile]);

  const hcEncrypt = useCallback(
    (data) => {
      return new Promise((resolve, reject) => {
        // Test localStorage is accessible
        if (!lsTest()) {
          reject(new Error('localStorage is not available'));
          return;
        }

        // if we dont have the paymail, get it
        if (authToken) {
          fetch(`${env.REACT_APP_API_URL}/hcEncrypt`, {
            method: 'POST',
            headers: {
              'Content-type': 'application/json',
            },
            body: JSON.stringify({ authToken, data }),
          })
            .then((resp) => {
              resp
                .json()
                .then((d) => {
                  const { encryptedData } = d;
                  // console.log({ encryptedData });
                  resolve(encryptedData);
                })
                .catch((e) => reject(e));
            })
            .catch((e) => reject(e));
        } else {
          reject(new Error('no auth token'));
        }
      });
    },
    [authToken],
  );

  const hcDecrypt = useCallback(
    async (encryptedData) => {
      return new Promise((resolve, reject) => {
        // Test localStorage is accessible
        if (!lsTest()) {
          reject(new Error('localStorage is not available'));
        }

        // if we dont have the paymail, get it
        if (authToken) {
          if (encryptedData) {
            setDecryptStatus(FetchStatus.Loading);
            fetch(`${env.REACT_APP_API_URL}/hcDecrypt`, {
              method: 'POST',
              headers: {
                'Content-type': 'application/json',
              },
              body: JSON.stringify({ authToken, encryptedData }),
            })
              .then((resp) => {
                resp.json().then((json) => {
                  setDecryptStatus(FetchStatus.Success);
                  resolve(json);
                });
              })
              .catch((e) => {
                if (typeof e.json === 'function') {
                  e.json().then(() => {
                    // TODO: Redirect to handcash url when perms get borked
                    // if (redirectUrl) {
                    //   window.location.href = redirectUrl;
                    // }
                  });
                }
                console.error(e);
                setDecryptStatus(FetchStatus.Error);
                reject(e);
              });
          }
        } else {
          reject(new Error('no auth token'));
        }
      });
    },
    [authToken],
  );

  // const hcSignOpReturnWithAIP = useCallback(
  //   async (encryptedIdentity, hexArray) => {
  //     return new Promise((resolve, reject) => {
  //       // Test localStorage is accessible
  //       if (!lsTest()) {
  //         reject(new Error("localStorage is not available"));
  //       }

  //       setSignStatus(FetchStatus.Loading);
  //       // if we dont have the paymail, get it
  //       if (authToken) {
  //         if (encryptedIdentity) {
  //           fetch(`https://bitchatnitro.com/hcsignops`, {
  //             method: "POST",
  //             headers: {
  //               "Content-type": "application/json",
  //             },
  //             body: JSON.stringify({ authToken, encryptedIdentity, hexArray }),
  //           })
  //             .then((resp) => {
  //               setSignStatus(FetchStatus.Success);
  //               resp.json().then(resolve);
  //             })
  //             .catch((e) => {
  //               setSignStatus(FetchStatus.Error);
  //               reject(e);
  //             });
  //         }
  //       } else {
  //         reject(new Error("no auth token"));
  //       }
  //     });
  //   },
  //   [signStatus, authToken, setProfile]
  // );

  const value = useMemo(
    () => ({
      setProfile,
      profile,
      getProfile,
      authToken,
      setAuthToken,
      hcEncrypt,
      hcDecrypt,
      decryptStatus,
    }),
    [
      authToken,
      profile,
      setProfile,
      getProfile,
      setAuthToken,
      hcEncrypt,
      hcDecrypt,
      decryptStatus,
    ],
  );

  return (
    <>
      <HandcashContext.Provider value={value} {...props} />
    </>
  );
};

const useHandcash = () => {
  const context = useContext(HandcashContext);
  if (context === undefined) {
    throw new Error('useHandcash must be used within an HandcashProvider');
  }
  return context;
};

export { HandcashProvider, useHandcash };

//
// Utils
//

const profileStorageKey = 'nitro__HandcashProvider_profile';
const authTokenStorageKey = 'nitro__HandcashProvider_authToken';

// Full profile
// {
//   publicProfile: {
//      id: "5f15c31c3c177d003028eb97",
//      handle: "BrandonC",
//      paymail: "BrandonC@handcash.io",
//      bitcoinUnit: "BSV",
//      displayName: "DuroMane.",
//      avatarUrl: "https://handcash.io/avatar/7d399a0c-22cf-40cf-b162-f5511a4645db",
//      localCurrencyCode: "USD",
//      createdAt: '2020-11-27T16:02:34.171Z'
//   },
//   privateProfile: {
//      phoneNumber: "+11234567891",
//      email: "Brandon@gmail.com"
//   }
// }
