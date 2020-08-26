const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const exec = require('@actions/exec');
const path = require('path');
const fs = require('fs').promises;

const isLinux = process.platform === 'linux';
const isDarwin = process.platform === 'darwin';
const isWin32 = process.platform === 'win32';

function assertPlatformSupported()
{
    if(!(isLinux || isDarwin || isWin32))
    {
        throw new Error('Unsupported platform');
    }
}

function getExecutablePath(directory)
{
    const exension = isWin32 ? "exe" : "sh";
    return path.join(directory, 'steamcmd.' + exension);
}

function getDownloadUrl()
{
    var archiveName;

    if (isLinux)
    {
        archiveName = 'steamcmd_linux.tar.gz';
    }
    else if (isDarwin)
    {
        archiveName = 'steamcmd_osx.tar.gz';
    }
    else if (isWin32)
    {
        archiveName = 'steamcmd.zip';
    }

    return 'https://steamcdn-a.akamaihd.net/client/installer/' + archiveName;
}

function getInfo(installDir)
{
    return isWin32 ?
    {
        directory: installDir.replace(/\\/g, "/"),
        executable: getExecutablePath(installDir).replace(/\\/g, "/"),
        binDirectory: installDir.replace(/\\/g, "/"),
    } :
    {
        directory: installDir,
        executable: getExecutablePath(installDir),
        binDirectory: path.join(installDir, 'bin'),
    };
}

async function install()
{
    //
    // Download
    //
    core.info('Downloading ...');
    var archivePath = await tc.downloadTool(getDownloadUrl());

    //
    // Extract
    //
    core.info('Extracting ...');
    var extractDir;

    if (isWin32)
    {
        extractDir = await tc.extractZip(archivePath, 'steamcmd');
    }
    else
    {
        extractDir = await tc.extractTar(archivePath, 'steamcmd');
    }

    //
    // Cache
    //
    core.info('Adding to the cache ...');
    installDir = await tc.cacheDir(extractDir, 'steamcmd', 'latest', 'i386');

    //
    // Install dependencies
    //
    if(isLinux)
    {
        core.info('Installing required dependencies ...');

        await exec.exec('sudo', ['apt-get', '--yes','update']);
        await exec.exec('sudo', ['apt-get', '--yes', 'install', 'lib32gcc1']);
    }

    // Creates executable without .sh extension.
    // So do not need anymore to write steamcmd.sh.
    if(isLinux || isDarwin)
    {
        var binDir = path.join(installDir, 'bin');
        const binExe = path.join(binDir, 'steamcmd');

        await fs.mkdir(binDir);
        await fs.writeFile(binExe, `#!/bin/bash\nexec "${installDir}/steamcmd.sh" "$@"`);
        await fs.chmod(binExe, 0o755);
    }

    // SteamCMD exits with code 7 on first run on Windows.
    if(isWin32)
    {
        core.info('Starting ...');

        try
        {
            const executable = getExecutablePath(installDir).replace(/\\/g, "/");
            await exec.exec(executable, ['+quit']);
        }
        catch(error)
        {
            if(error.message.endsWith('failed with exit code 7'))
            {
                core.info('Skipping exit code 7.');
            }
            else
            {
                throw error;
            }
        }
    }

    core.info('Done');

    return getInfo(installDir);
}

async function installIfNeed()
{
    installDir = tc.find('steamcmd', 'latest');

    if(installDir)
    {
        core.info(`Found in cache @ ${installDir}`);

        return getInfo(installDir);
    }
    else
    {
        return await install();
    }
}

async function run()
{
    try
    {
        assertPlatformSupported();

        const info = await installIfNeed();

        core.setOutput('directory', info.directory);
        core.setOutput('executable', info.executable);

        core.addPath(info.binDirectory);
    }
    catch (error)
    {
        core.setFailed(error);
    }
}

run();
