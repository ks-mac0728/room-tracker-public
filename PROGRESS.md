# 開発進捗

## 最終更新
2026-07-15

## 最後の作業環境
- 端末: 開発Mac
- 日時: 2026-07-15

## 前回やったこと
- Code.js / Index.html / ios_shortcut_js.js / appsscript.json / README.md を実装
- clasp で GAS プロジェクト作成・デプロイ
- ios_shortcut_js.js が GAS サーバー側に誤ってデプロイされてエラーになる問題を修正
  - .claspignore に追加して GAS プッシュから除外
  - GAS API 経由でファイルを削除し再デプロイ
- ダッシュボード表示を確認済み

## WebアプリURL（デプロイ済み）
```
https://script.google.com/macros/s/AKfycbyzLvVzPzT16OzGwAwYbFstGJyUqeTve1R3r-wIqbyvfdWZpPX9BeOXqdjDAS8muIoocg/exec
```

## スプレッドシートURL
```
https://drive.google.com/open?id=1F6hXasIeIco3l6JSPOEKU0ySSBViiO4mZ9-ZT40q-9g
```

## 次にやること
- iOSショートカットを作成してデータ送信テスト
- 実際にデータが記録されるか（スプレッドシート「記録」シート）確認
- 必要に応じて ios_shortcut_js.js の DOM抽出パターンを調整

## 未完了の課題
- iOSショートカット動作確認未実施

## ユーザーの意図・構想
- 楽天ROOMの成果をトラッキングするダッシュボードを他ユーザーに配布したい
- スマホ（iOS）ショートカット＋GAS WebAppで完結させる（RPA端末不要）
- データ収集はiOSショートカットが担当（ユーザー自身のブラウザで実行 → スクレイピングに当たらない）
- 毎日の通知を1タップするだけ、またはダッシュボードの「更新」ボタンで手動更新
- Threads投稿機能はスコープ外（ダッシュボード機能のみ）
- 既存の rakuten-room-tracker とは完全に別プロジェクトとして管理
- データスキーマは既存の rakuten-room-tracker と同一（followers/following/posts/likes/rank）
- 他ユーザーがコピーして使えるテンプレートとして配布
