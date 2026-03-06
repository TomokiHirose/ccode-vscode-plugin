import * as https from 'https';

export interface UsageData {
    five_hour: { utilization: number; resets_at: string };
    seven_day: { utilization: number; resets_at: string };
}

export interface ApiResult {
    success: boolean;
    data?: UsageData;
    error?: string;
    rateLimited?: boolean;
    retryAfterSeconds?: number;
}

export class ApiClient {
    private static readonly ENDPOINT = 'https://api.anthropic.com/api/oauth/usage';
    private static readonly TIMEOUT_MS = 15000;

    static fetchUsage(accessToken: string): Promise<ApiResult> {
        return new Promise((resolve) => {
            const url = new URL(this.ENDPOINT);

            const req = https.request(
                {
                    hostname: url.hostname,
                    path: url.pathname,
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'anthropic-beta': 'oauth-2025-04-20',
                    },
                },
                (res) => {
                    let body = '';
                    res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
                    res.on('end', () => {
                        const status = res.statusCode ?? 0;
                        if (status === 401) {
                            resolve({ success: false, error: 'Unauthorized: token may be expired' });
                            return;
                        }
                        if (status === 403) {
                            resolve({ success: false, error: 'Forbidden: insufficient permissions' });
                            return;
                        }
                        if (status === 429) {
                            const retryAfterHeader = res.headers['retry-after'];
                            const parsed = retryAfterHeader ? parseInt(String(retryAfterHeader), 10) : undefined;
                            const retryAfterSeconds = parsed !== undefined && !Number.isNaN(parsed) ? parsed : undefined;
                            resolve({ success: false, error: 'Rate limited: too many requests', rateLimited: true, retryAfterSeconds });
                            return;
                        }
                        if (status < 200 || status >= 300) {
                            resolve({ success: false, error: `API returned HTTP ${status}` });
                            return;
                        }
                        try {
                            const data = JSON.parse(body) as UsageData;
                            resolve({ success: true, data });
                        } catch {
                            resolve({ success: false, error: 'Failed to parse API response' });
                        }
                    });
                }
            );

            req.setTimeout(this.TIMEOUT_MS, () => {
                req.destroy();
                resolve({ success: false, error: `Request timed out (${this.TIMEOUT_MS / 1000}s)` });
            });

            req.on('error', (e) => {
                resolve({ success: false, error: `Network error: ${e.message}` });
            });

            req.end();
        });
    }
}
