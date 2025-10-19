"use client";

import { useAuth0 } from "@auth0/auth0-react";
import React from "react";

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-4">You are not logged in.</div>;
  }

  return (
    <div className="p-4">
      {user?.picture && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.picture as string} alt={user.name as string} className="w-20 h-20 rounded-full" />
      )}
      <h2 className="mt-2 text-lg font-semibold">{user?.name}</h2>
      <p className="text-sm text-slate-400">{user?.email}</p>
    </div>
  );
};

export default Profile;