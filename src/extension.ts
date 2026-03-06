import * as vscode from 'vscode';
import { StatusBarProvider } from './statusBarProvider';
import { ApiClient } from './apiClient';
import { CredentialsLoader } from './credentialsLoader';
import { OutputFormatter } from './outputFormatter';

let statusBarProvider: StatusBarProvider;
let intervalId: NodeJS.Timeout | undefined;
let rateLimitTimeoutId: NodeJS.Timeout | undefined;
let consecutiveRateLimitCount = 0;
const BACKOFF_STEPS_MINUTES = [5, 10];

export function activate(context: vscode.ExtensionContext) {
    statusBarProvider = new StatusBarProvider();

    const refreshCommand = vscode.commands.registerCommand('claudeCodeUsage.refresh', async () => {
        await fetchAndDisplay();
    });

    const showOutputCommand = vscode.commands.registerCommand('claudeCodeUsage.showOutput', () => {
        showDetailedOutput();
    });

    const configurationChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('claudeCodeUsage')) {
            restartPeriodicExecution();
        }
    });

    startPeriodicExecution();
    setTimeout(() => { fetchAndDisplay(); }, 1000);

    context.subscriptions.push(
        refreshCommand,
        showOutputCommand,
        configurationChangeListener,
        statusBarProvider,
    );
}

async function fetchAndDisplay(): Promise<void> {
    const config = vscode.workspace.getConfiguration('claudeCodeUsage');
    const enabled = config.get<boolean>('enabled', true);

    if (!enabled) {
        const d = OutputFormatter.formatDisabled();
        statusBarProvider.updateDisplay(d.text, d.tooltip, d.color);
        return;
    }

    const credentialsPath = config.get<string>('credentialsPath', '~/.claude/.credentials.json');

    const loading = OutputFormatter.formatLoading();
    statusBarProvider.updateDisplay(loading.text, loading.tooltip, loading.color);

    const credResult = CredentialsLoader.loadToken(credentialsPath);
    if (!credResult.accessToken) {
        const d = OutputFormatter.formatError(credResult.error ?? 'Failed to load credentials');
        statusBarProvider.updateDisplay(d.text, d.tooltip, d.color);
        return;
    }

    try {
        const apiResult = await ApiClient.fetchUsage(credResult.accessToken);

        if (!apiResult.success || !apiResult.data) {
            if (apiResult.rateLimited) {
                handleRateLimit(apiResult.retryAfterSeconds);
                return;
            }
            const d = OutputFormatter.formatError(apiResult.error ?? 'API request failed');
            statusBarProvider.updateDisplay(d.text, d.tooltip, d.color);
            return;
        }

        consecutiveRateLimitCount = 0;
        statusBarProvider.setLastRawData(JSON.stringify(apiResult.data, null, 2));
        const d = OutputFormatter.formatApiResponse(apiResult.data);
        statusBarProvider.updateDisplay(d.text, d.tooltip, d.color);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const d = OutputFormatter.formatError(message);
        statusBarProvider.updateDisplay(d.text, d.tooltip, d.color);
    }
}

function startPeriodicExecution(): void {
    const config = vscode.workspace.getConfiguration('claudeCodeUsage');
    const intervalMinutes = config.get<number>('intervalMinutes', 20);

    if (intervalMinutes > 0) {
        intervalId = setInterval(() => { fetchAndDisplay(); }, intervalMinutes * 60 * 1000);
    }
}

function handleRateLimit(retryAfterSeconds?: number): void {
    stopPeriodicExecution();
    if (rateLimitTimeoutId) {
        clearTimeout(rateLimitTimeoutId);
        rateLimitTimeoutId = undefined;
    }
    consecutiveRateLimitCount++;

    let waitMinutes: number;
    if (retryAfterSeconds !== undefined) {
        waitMinutes = Math.ceil(retryAfterSeconds / 60);
    } else {
        const stepIndex = consecutiveRateLimitCount - 1;
        if (stepIndex < BACKOFF_STEPS_MINUTES.length) {
            waitMinutes = BACKOFF_STEPS_MINUTES[stepIndex];
        } else {
            consecutiveRateLimitCount = 0;
            startPeriodicExecution();
            return;
        }
    }

    const d = OutputFormatter.formatRateLimited(waitMinutes);
    statusBarProvider.updateDisplay(d.text, d.tooltip, d.color);

    rateLimitTimeoutId = setTimeout(() => {
        rateLimitTimeoutId = undefined;
        fetchAndDisplay().then(() => {
            if (consecutiveRateLimitCount === 0) {
                startPeriodicExecution();
            }
        });
    }, waitMinutes * 60 * 1000);
}

function stopPeriodicExecution(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
    }
}

function restartPeriodicExecution(): void {
    if (rateLimitTimeoutId) {
        clearTimeout(rateLimitTimeoutId);
        rateLimitTimeoutId = undefined;
    }
    consecutiveRateLimitCount = 0;
    stopPeriodicExecution();
    startPeriodicExecution();
    fetchAndDisplay();
}

function showDetailedOutput(): void {
    const rawData = statusBarProvider.getLastRawData();
    const content = rawData
        ? `Claude API Usage Response:\n\n${rawData}`
        : 'No usage data available. Try refreshing (click the status bar item).';

    vscode.workspace.openTextDocument({ content, language: 'json' }).then(doc => {
        vscode.window.showTextDocument(doc);
    });
}

export function deactivate() {
    stopPeriodicExecution();
    if (rateLimitTimeoutId) {
        clearTimeout(rateLimitTimeoutId);
        rateLimitTimeoutId = undefined;
    }
    if (statusBarProvider) {
        statusBarProvider.dispose();
    }
}
