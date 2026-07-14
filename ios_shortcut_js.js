/**
 * iOSショートカット用 — 楽天ROOMプロフィールデータ抽出スクリプト
 *
 * 使い方:
 *   iOSショートカットアプリの「Webページ上でJavaScriptを実行」アクションに
 *   このコードを貼り付ける。
 *   Safariで楽天ROOMのプロフィールページ（例: https://room.rakuten.co.jp/room_xxx）
 *   を開いた状態でショートカットを実行すること。
 *
 * 返り値:
 *   JSON文字列 { followers, following, posts, likes, url }
 *   GASの receiveStats エンドポイントに POST する想定。
 */
(function() {
  function parseNum(s) {
    return parseInt(String(s || '').replace(/[,，\s]/g, '')) || null;
  }

  const result = { followers: null, following: null, posts: null, likes: null };

  // --- Step 1: __INITIAL_STATE__ から取得を試みる ---
  try {
    const ud = window.__INITIAL_STATE__ && window.__INITIAL_STATE__.userData;
    if (ud) {
      result.followers = parseNum(ud.followers_count  || ud.follower_count  || ud.followersCount);
      result.following = parseNum(ud.following_count  || ud.followingCount);
      result.posts     = parseNum(ud.item_count       || ud.collect_count   || ud.itemsCount);
      result.likes     = parseNum(ud.liked_count      || ud.like_count      || ud.likesCount);
    }
  } catch(e) {}

  // --- Step 2: DOM テキストからフォールバック抽出 ---
  if (!result.followers) {
    try {
      const bodyText = document.body.innerText;

      const patterns = [
        { key: 'followers', re: /フォロワー[\s\S]{0,200}?([\d,]+)/ },
        { key: 'following', re: /(?<!する)フォロー[\s\S]{0,200}?([\d,]+)/ },
        { key: 'posts',     re: /商品[\s\S]{0,100}?([\d,]+)/ },
        { key: 'likes',     re: /いいね[\s\S]{0,100}?([\d,]+)/ },
      ];

      patterns.forEach(({ key, re }) => {
        if (result[key] != null) return;
        const m = bodyText.match(re);
        if (m) result[key] = parseNum(m[1]);
      });
    } catch(e) {}
  }

  result.url = location.href;

  // ショートカットの「Webページ上でJavaScriptを実行」はreturn値を受け取る
  return JSON.stringify(result);
})();
