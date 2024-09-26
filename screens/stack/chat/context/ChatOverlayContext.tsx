import React, { useContext } from 'react';

export type BlurType = 'light' | 'dark' | undefined;

export type Overlay = 'addMembers' | 'alert' | 'channelInfo' | 'confirmation' | 'none' | 'userInfo';

export type ChatOverlayContextValue = {
  overlay: Overlay;
  setOverlay: React.Dispatch<React.SetStateAction<Overlay>>;
};
export const ChatOverlayContext = React.createContext<ChatOverlayContextValue>(
  {} as ChatOverlayContextValue,
);

export type ChatOverlayProviderProps = {
  value?: Partial<ChatOverlayContextValue>;
};

export const useChatOverlayContext = () => useContext(ChatOverlayContext);
