"use client";

import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';

type Props = {
  children: React.ReactNode;
};

const Auth0ClientProvider: React.FC<Props> = ({ children }) => {
  const domain = "dev-dz7bvys12btnyjve.us.auth0.com";
  const clientId = "eRwz6fn4pmZ1HfpNZqqB9CkkoJaO9Pj1";

  // Safely compute redirect_uri in the browser
  const redirect_uri = typeof window !== 'undefined' ? window.location.origin : undefined;

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ redirect_uri: redirect_uri }}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ClientProvider;
