# Change Log

## [0.1.0]

### 変更
- プラグイン名を `Claude Code Usage Check in Status Bar` に変更
- Anthropic OAuth Usage API（`/api/oauth/usage`）を使用したレート制限使用量の表示に変更
- ステータスバー表示形式をプログレスバー（`▰▰▰▱▱▱▱▱▱▱ 5h  ▰▰▰▱▱▱▱▱▱▱ 7d`）に変更
- 設定項目 `command`・`maxLength` を削除し `credentialsPath` を追加
- コマンドID・設定キーのプレフィックスを `ccusageStatusBar` → `claudeCodeUsage` に変更

### 追加
- `~/.claude/.credentials.json` からの OAuth トークン自動読み込み（パスは設定変更可）
- ツールチップにリセット時刻（JST）と最終更新時刻を表示

### 削除
- ターミナルで Claude Code を開くコマンド（`openTerminal`）を削除
- `npx` によるccusageコマンド実行機能を削除
