import { UsageData } from './apiClient';

export interface DisplayData {
    text: string;
    tooltip: string;
    color: string;
}

const FILLED = '▰';
const EMPTY = '▱';
const SEGMENTS = 10;

const COLOR_GREEN = '#97C9C3';
const COLOR_YELLOW = '#E5C07B';
const COLOR_RED = '#E06C75';

// utilization は API から 0〜100 の値で返ってくる
function utilizationColor(utilization: number): string {
    if (utilization >= 80) { return COLOR_RED; }
    if (utilization >= 50) { return COLOR_YELLOW; }
    return COLOR_GREEN;
}

function progressBar(utilization: number): string {
    const clamped = Math.min(Math.max(utilization, 0), 100);
    const filled = Math.round(clamped / 100 * SEGMENTS);
    return FILLED.repeat(filled) + EMPTY.repeat(SEGMENTS - filled);
}

function formatResetTime(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }) + ' JST';
    } catch {
        return isoString;
    }
}

function nowJst(): string {
    return new Date().toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
    }) + ' JST';
}

export class OutputFormatter {
    static formatApiResponse(data: UsageData): DisplayData {
        const fiveHour = data.five_hour;
        const sevenDay = data.seven_day;

        const fivePct = Math.round(fiveHour.utilization);
        const sevenPct = Math.round(sevenDay.utilization);

        const fiveBar = progressBar(fiveHour.utilization);
        const sevenBar = progressBar(sevenDay.utilization);

        const text = `${fiveBar} 5h  ${sevenBar} 7d`;

        const maxUtilization = Math.max(fiveHour.utilization, sevenDay.utilization);
        const color = utilizationColor(maxUtilization);

        const tooltip = [
            'Claude API Usage',
            '────────────────',
            `5時間:  ${fivePct}% (リセット: ${formatResetTime(fiveHour.resets_at)})`,
            `7日間:  ${sevenPct}% (リセット: ${formatResetTime(sevenDay.resets_at)})`,
            '────────────────',
            `最終更新: ${nowJst()}`,
        ].join('\n');

        return { text, tooltip, color };
    }

    static formatError(error: string): DisplayData {
        let text = '$(error) Claude: Error';
        let tooltip = error;

        if (error.includes('not found')) {
            text = '$(error) Claude: No credentials';
            tooltip = `クレデンシャルファイルが見つかりません。\nSettings で claudeCodeUsage.credentialsPath を設定してください。\n\n${error}`;
        } else if (error.includes('Unauthorized') || error.includes('expired')) {
            text = '$(error) Claude: Auth error';
            tooltip = `認証エラー。トークンが期限切れの可能性があります。\n\n${error}`;
        } else if (error.includes('Network') || error.includes('timed out')) {
            text = '$(error) Claude: Network error';
            tooltip = `ネットワークエラー。\n\n${error}`;
        }

        return { text, tooltip, color: COLOR_RED };
    }

    static formatRateLimited(waitMinutes: number): DisplayData {
        return {
            text: '$(watch) Claude: Rate limited',
            tooltip: `レート制限中 (429)。約 ${waitMinutes} 分後に再試行します。`,
            color: COLOR_YELLOW,
        };
    }

    static formatLoading(): DisplayData {
        return {
            text: '$(sync~spin) Claude: Loading...',
            tooltip: 'Claude API使用量を取得中...',
            color: COLOR_GREEN,
        };
    }

    static formatDisabled(): DisplayData {
        return {
            text: '$(graph) Claude: Disabled',
            tooltip: 'Claude Code Usage Checker は無効です。\nclaudeCodeUsage.enabled を true にしてください。',
            color: COLOR_GREEN,
        };
    }
}
