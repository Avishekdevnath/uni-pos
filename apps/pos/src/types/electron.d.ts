interface Window {
  electronAPI: {
    minimize: () => void;
    maximize: () => void;
    close: (force?: boolean) => void;
  };
}
