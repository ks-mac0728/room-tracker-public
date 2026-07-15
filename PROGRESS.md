# 開発進捗

## 最終更新
2026-07-15

## 最後の作業環境
- 端末: 開発Mac
- 日時: 2026-07-15

## 前回やったこと
- Code.js / Index.html / ios_shortcut_js.js / appsscript.json / README.md を実装
- clasp で GAS プロジェクト作成・コードプッシュ・WebAppデプロイ
- ios_shortcut_js.js が GAS サーバー側に混入してエラー → .claspignore で修正・再デプロイ
- ダッシュボード表示を確認済み
- ios_shortcut_js.js に `action: "receiveStats"` を含めてショートカットを2ステップに簡略化
- shortcut_template.shortcut（タップでインストール用）を生成・GitHubに公開
- GitHubリポジトリをpublicに変更済み
- jsDelivr経由でのファイル配信は成功（200）だが、iOS側で「未署名のショートカット」エラーが出てインストール不可

## WebアプリURL（デプロイ済み）
```
https://script.google.com/macros/s/AKfycbyzLvVzPzT16OzGwAwYbFstGJyUqeTve1R3r-wIqbyvfdWZpPX9BeOXqdjDAS8muIoocg/exec
```

## スプレッドシートURL
```
https://drive.google.com/open?id=1F6hXasIeIco3l6JSPOEKU0ySSBViiO4mZ9-ZT40q-9g
```

## ショートカット配布URL（現状）
```
https://cdn.jsdelivr.net/gh/ks-mac0728/room-tracker-public@main/shortcut_template.shortcut
```
※ iOS側で「信頼されていないショートカット」エラーになる。設定→ショートカット→「信頼されていないショートカットを許可」をオンにすれば回避可能。

## 次にやること（優先順）
1. ショートカットのインストール方法を解決する
   - 案A: ユーザーに「信頼されていないショートカットを許可」をオンにしてもらう（設定→ショートカット）
   - 案B: RoutineHub などのサービスにショートカットを登録して iCloud 署名済みリンクを取得する
   - 案C: 手動で2ステップ作る（コピペのみ、確実）
2. iOSショートカットを実際に実行してデータ送信テスト
3. スプレッドシートの「記録」シートにデータが入ることを確認

## 未完了の課題
- iOSショートカットのインストール・動作確認が未完了
- Chromeでは使えない（Safari専用）

## ユーザーの意図・構想
- 楽天ROOMの成果をトラッキングするダッシュボードを他ユーザーに配布したい
- スマホ（iOS）ショートカット＋GAS WebAppで完結させる（RPA端末不要）
- データ収集はiOSショートカットが担当（ユーザー自身のブラウザで実行 → スクレイピングに当たらない）
- 毎日の通知を1タップするだけ、またはダッシュボードの「更新」ボタンで手動更新
- Threads投稿機能はスコープ外（ダッシュボード機能のみ）
- 既存の rakuten-room-tracker とは完全に別プロジェクトとして管理
- データスキーマは既存の rakuten-room-tracker と同一（followers/following/posts/likes/rank）
- 他ユーザーがコピーして使えるテンプレートとして配布
