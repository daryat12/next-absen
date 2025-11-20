"use client";
import { createContext, useContext, useState } from "react";

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const [showProfile, setShowProfile] = useState(false);
  return (
    <ProfileContext.Provider value={{ showProfile, setShowProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
