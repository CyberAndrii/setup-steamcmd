import * as toolcache from '@actions/tool-cache';

export async function find(): Promise<string> {
    return toolcache.find('steamcmd', 'latest');
}
