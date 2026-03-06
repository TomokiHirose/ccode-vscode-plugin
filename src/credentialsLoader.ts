import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface CredentialsResult {
    accessToken: string | null;
    error?: string;
}

interface ClaudeCredentials {
    claudeAiOauth?: {
        accessToken?: string;
    };
}

export class CredentialsLoader {
    static expandTilde(filePath: string): string {
        if (filePath === '~' || filePath.startsWith('~/')) {
            return path.join(os.homedir(), filePath.slice(1));
        }
        return filePath;
    }

    static loadToken(credentialsPath: string): CredentialsResult {
        const expanded = this.expandTilde(credentialsPath);

        if (!fs.existsSync(expanded)) {
            return { accessToken: null, error: `Credentials file not found: ${expanded}` };
        }

        let raw: string;
        try {
            raw = fs.readFileSync(expanded, 'utf-8');
        } catch (e) {
            return { accessToken: null, error: `Failed to read credentials file: ${e}` };
        }

        let json: ClaudeCredentials;
        try {
            json = JSON.parse(raw) as ClaudeCredentials;
        } catch {
            return { accessToken: null, error: 'Credentials file is not valid JSON' };
        }

        const token = json?.claudeAiOauth?.accessToken;
        if (!token) {
            return { accessToken: null, error: 'accessToken not found (expected: claudeAiOauth.accessToken)' };
        }

        return { accessToken: token };
    }
}
