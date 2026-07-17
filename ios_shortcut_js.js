/**
 * iOSショートカット用 — 楽天ROOMプロフィールデータ抽出スクリプト
 *
 * 使い方:
 *   1. Safariで楽天ROOMのプロフィールページを開く
 *   2. ショートカットを実行する
 *
 * このスクリプトの返り値をそのままGASにPOSTするだけでOK。
 * （ショートカットのステップは「JS実行」→「URLの内容を取得」の2つだけ）
 *
 * ROOMのプロフィールページはSSR（サーバー側レンダリング）されており、
 * window.__INITIAL_STATE__ にフォロワー数等がそのまま入っているため、
 * DOMのテキストを正規表現で探すより、こちらを直接読む方が確実。
 */
(function() {
  const u = (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.userData) || {};

  return JSON.stringify({
    action:    "receiveStats",
    url:       location.href,
    followers: u.followers != null ? u.followers : null,
    following: u.following_users != null ? u.following_users : null,
    posts:     u.collections != null ? u.collections : null,
    likes:     u.likes != null ? u.likes : null,
    rank:      u.rank != null ? String(u.rank) : "",
  });
})();
