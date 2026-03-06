import * as vscode from 'vscode';

export class StatusBarProvider {
    private statusBarItem: vscode.StatusBarItem;
    private lastRawData: string = '';

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'claudeCodeUsage.refresh';
        this.statusBarItem.text = '$(sync~spin) Claude: Starting...';
        this.statusBarItem.tooltip = 'Claude API Usage - Initializing';
        this.statusBarItem.show();
    }

    public updateDisplay(text: string, tooltip?: string, color?: string): void {
        this.statusBarItem.text = text;
        this.statusBarItem.tooltip = tooltip ?? text;
        this.statusBarItem.color = color;
    }

    public setLastRawData(rawData: string): void {
        this.lastRawData = rawData;
    }

    public getLastRawData(): string {
        return this.lastRawData;
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}
