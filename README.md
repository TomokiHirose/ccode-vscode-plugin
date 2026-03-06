# Claude Code Usage Check in Status Bar

Claude APIのレート制限使用量をVSCodeのステータスバーに表示します。

## 機能

- 5時間・7日間のレート制限使用量をプログレスバーで表示
- 使用率に応じたカラーリング（0-49%: 緑 / 50-79%: 黄 / 80-100%: 赤）
- 20分間隔での自動更新（設定可能）
- ステータスバーのクリックで手動リフレッシュ

## 前提条件

- Claude Code にログインしていること
- `~/.claude/.credentials.json` が存在すること

## 表示形式

```
▰▰▰▰▰▱▱▱▱▱ 5h  ▰▰▰▱▱▱▱▱▱▱ 7d
```

ツールチップ:
```
Claude API Usage
────────────────
5時間:  45% (リセット: 3/5 14:30 JST)
7日間:  32% (リセット: 3/10 09:00 JST)
────────────────
最終更新: 14:28 JST
```

## 設定

| 設定キー | 型 | デフォルト | 説明 |
|---------|-----|-----------|------|
| `claudeCodeUsage.intervalMinutes` | number | `20` | ポーリング間隔（分）。`0` で無効化 |
| `claudeCodeUsage.credentialsPath` | string | `~/.claude/.credentials.json` | クレデンシャルファイルのパス |
| `claudeCodeUsage.enabled` | boolean | `true` | 有効/無効 |

## コマンド
定期実行されるコマンドを、VSCodeのコマンドパレットからも手動で実行できます。

- **Claude Code Usage: Refresh** — 手動でステータスを更新
- **Claude Code Usage: Show Output** — APIレスポンスのJSONを表示

## インストール

1. VSIXファイルをダウンロード
2. VSCodeの拡張機能タブ → `...` → `Install from VSIX...` でファイルを選択

## リリースノート

### 0.1.0

- Anthropic OAuth Usage APIを使用したレート制限使用量の表示に変更
- ステータスバー表示形式をプログレスバーに変更
- 設定キーを `claudeCodeUsage.intervalMinutes`（分指定）に変更
