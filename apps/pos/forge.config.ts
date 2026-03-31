import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'node:path';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'UniMartPOS',
    executableName: 'UniMartPOS',
    appVersion: '1.0.0',
    icon: path.join(__dirname, 'assets', 'icon'),
    appCopyright: 'Copyright © 2025 Avishek Devnath',
    win32metadata: {
      CompanyName: 'Avishek Devnath',
      FileDescription: 'UniMart Point of Sale',
      ProductName: 'UniMart POS',
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'UniMartPOS',
      authors: 'Avishek Devnath',
      description: 'UniMart Point of Sale',
      setupExe: 'UniMartPOS-Setup.exe',
      setupIcon: path.join(__dirname, 'assets', 'icon.ico'),
      loadingGif: undefined,
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({
      options: {
        name: 'unimart-pos',
        productName: 'UniMart POS',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        categories: ['Office'],
        maintainer: 'Avishek Devnath',
        description: 'UniMart Point of Sale',
      },
    }),
    new MakerRpm({
      options: {
        name: 'unimart-pos',
        productName: 'UniMart POS',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        categories: ['Office'],
        description: 'UniMart Point of Sale',
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
