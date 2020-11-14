import * as path from 'path';
import * as fs from 'fs';

import * as finder from './find-steamcmd';

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as toolcache from '@actions/tool-cache';

const IS_LINUX: boolean = process.platform === 'linux';
const IS_WINDOWS: boolean = process.platform === 'win32';
const IS_DARWIN: boolean = process.platform === 'darwin';

const BIN_FOLDER_NAME: string = '_bin';

export interface InstallInfo {
    directory: string;
    binDirectory: string;
    executable: string;
}

export async function installIfNeed(): Promise<InstallInfo> {
    if (!(IS_LINUX || IS_WINDOWS || IS_DARWIN)) {
        throw new Error('Unsupported platform');
    }

    const installDir: string = await finder.find();

    if (installDir) {
        core.info(`Found in cache: ${installDir}`);
        return getInstallInfo(installDir);
    } else {
        return await install();
    }
}

async function install(): Promise<InstallInfo> {
    const downloadDir: string = await download();
    const installDir: string = await cache(downloadDir);

    await installRequiredDependencies();
    await setupBin(installDir);
    await update(installDir);

    core.info('Done');
    return getInstallInfo(installDir);
}

async function download(): Promise<string> {
    core.info('Downloading ...');
    let archivePath: string = await toolcache.downloadTool(getDownloadUrl());

    core.info('Extracting ...');
    if (IS_WINDOWS) {
        return await toolcache.extractZip(archivePath, 'steamcmd');
    } else {
        return await toolcache.extractTar(archivePath, 'steamcmd');
    }
}

function getDownloadUrl(): string {
    const url: string = 'https://steamcdn-a.akamaihd.net/client/installer/';

    if (IS_LINUX) {
        return url + 'steamcmd_linux.tar.gz';
    } else if (IS_WINDOWS) {
        return url + 'steamcmd.zip';
    } else if (IS_DARWIN) {
        return url + 'steamcmd_osx.tar.gz';
    }

    throw Error('Unsupported platform');
}

async function cache(downloadDir: string): Promise<string> {
    core.info('Adding to the cache ...');
    return await toolcache.cacheDir(downloadDir, 'steamcmd', 'latest', 'i386');
}

async function installRequiredDependencies() {
    if (IS_LINUX) {
        core.info('Installing required dependencies ...');
        await exec.exec('sudo', ['apt-get', 'update', '--yes']);
        await exec.exec('sudo', ['apt-get', 'install', 'lib32gcc1', '--yes']);
    }
}

async function setupBin(installDir: string) {
    const binDir: string = path.join(installDir, BIN_FOLDER_NAME);
    await fs.promises.mkdir(binDir);

    if (IS_LINUX || IS_DARWIN) {
        const binExe: string = path.join(binDir, 'steamcmd');
        await fs.promises.writeFile(
            binExe,
            '#!/bin/bash\nexec "$(dirname "$BASH_SOURCE")/../steamcmd.sh" "$@"'
        );
        await fs.promises.chmod(binExe, 0o755);
    } else if (IS_WINDOWS) {
        const binExe: string = path.join(binDir, 'steamcmd.bat');
        await fs.promises.writeFile(
            binExe,
            'powershell -command ""%~dp0\\..\\steamcmd.exe" %*"'
        );
    }
}

function getInstallInfo(installDir: string): InstallInfo {
    return IS_WINDOWS
        ? {
              directory: installDir,
              binDirectory: getBinDirectory(installDir),
              executable: getExecutablePath(installDir),
          }
        : {
              directory: installDir,
              binDirectory: getBinDirectory(installDir),
              executable: getExecutablePath(installDir),
          };
}

function getBinDirectory(installDir: string): string {
    return path.join(installDir, BIN_FOLDER_NAME);
}

function getExecutablePath(installDir: string): string {
    return path.join(installDir, 'steamcmd.' + (IS_WINDOWS ? 'exe' : 'sh'));
}

async function update(installDir: string) {
    core.info('Updating ...');
    try {
        await exec.exec(getExecutablePath(installDir), ['+quit']);
    } catch (error) {
        // steamcmd exits with error code 7 on first run on windows
        if (IS_WINDOWS && error.message.endsWith('failed with exit code 7')) {
            core.info('Skipping exit code 7');
        } else {
            throw error;
        }
    }
}
