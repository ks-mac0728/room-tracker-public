/**
 * iOSショートカット用 — 楽天ROOMプロフィールデータ抽出スクリプト
 *
 * 使い方:
 *   1. Safariで楽天ROOMのプロフィールページを開く
 *   2. ショートカットを実行する
 *
 * このスクリプトの返り値をそのままGASにPOSTするだけでOK。
 * （ショートカットのステップは「JS実行」→「URLの内容を取得」の2つだけ）
 */
(function() {
  function parseNum(s) {
    return parseInt(String(s || '').replace(/[,，\s]/g, '')) || null;
  }

  const result = {
    action:    "receiveStats",
    followers: null,
    following: null,
    posts:     null,
    likes:     null,
  };

  // Step 1: __INITIAL_STATE__ から取得を試みる
  try {
    const ud = window.__INITIAL_STATE__ && window.__INITIAL_STATE__.userData;
    if (ud) {
      result.followers = parseNum(ud.followers_count || ud.follower_count || ud.followersCount);
      result.following = parseNum(ud.following_count || ud.followingCount);
      result.posts     = parseNum(ud.item_count      || ud.collect_count  || ud.itemsCount);
      result.likes     = parseNum(ud.liked_count     || ud.like_count     || ud.likesCount);
    }
  } catch(e) {}

  // Step 2: DOM テキストからフォールバック抽出
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

  return JSON.stringify(result);
})();
