import * as installer from './install-steamcmd';

import * as core from '@actions/core';

async function run() {
    try {
        const installInfo: installer.InstallInfo = await installer.installIfNeed();

        core.setOutput('directory', installInfo.directory);
        core.setOutput('executable', installInfo.executable);
        core.addPath(installInfo.binDirectory);
    } catch (error) {
        core.setFailed(error);
    }
}

run();
