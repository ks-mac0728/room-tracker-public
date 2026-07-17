const SHEET_DATA     = "記録";
const SHEET_SETTINGS = "設定";

// ダッシュボードのHTMLをここから毎回取得する（開発者が中央でUI・機能をコントロールするため）。
// リポジトリのIndex.htmlを更新すれば、既にコピー済みの全ユーザーのダッシュボードにも反映される
// （jsDelivrのキャッシュ都合で、反映まで数時間かかることがある）。
const DASHBOARD_HTML_URL = "https://cdn.jsdelivr.net/gh/ks-mac0728/room-tracker-public@main/Index.html";

// ユーザーが自分の意思で差し出した情報（メールアドレス等）の送り先。
// トラッキングデータとは違い、これは開発者側が中央で受け取る想定。
// 空のままなら送信をスキップする（未設定でも他の機能に影響しない）。
const INFO_FORM_URL = "";
const INFO_FORM_ENTRY_MAP = {
  // 例: email: "entry.123456789"
};

/**
 * Apps Scriptエディタはデフォルトでファイル先頭の関数を選択した状態で開くため、
 * この関数をファイルの先頭に置いてある（プルダウンで選び直さず、そのまま▶実行ボタンを押すだけで良いように）。
 * ROOMのデータ取得はGASサーバーからは行わない（楽天側のAkamaiボット対策により、
 * UrlFetchAppでの直接アクセスは常にブロックされることを確認済み）。
 * 実際の取得は本物のブラウザ（iOSショートカット。README参照）が行い、ここへPOSTする。
 * この関数は「設定」シートの用意を確認するだけの簡単な初期化用。
 */
function setup() {
  _settingsSheet();
  Logger.log("準備完了。続けて「デプロイ→新しいデプロイ→ウェブアプリ」でダッシュボードURLを発行し、READMEの手順でiOSショートカットを設定してください。");
}

function doGet(e) {
  const html = _fetchDashboardHtml();
  const tmpl = HtmlService.createTemplate(html);
  tmpl.baseUrl     = ScriptApp.getService().getUrl();
  tmpl.roomUrl     = getConfig()["room_url"] || "";
  tmpl.initialData = JSON.stringify(getData('1y'));
  const output = tmpl.evaluate();
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  return output;
}

/**
 * iOSショートカットからのPOSTを受け取る。実際のROOMページ取得・解析はショートカット側
 * （本物のSafari＋JS実行）が既に終えた状態でここに届くため、GAS側はデータの受け取り・記録のみ行う。
 */
function doPost(e) {
  try {
    // フォーム送信（ブックマークレット）はe.parameter.payloadに、
    // 生のJSON POST（iOSショートカット等）はe.postData.contentsに入る。両対応。
    const data   = (e.parameter && e.parameter.payload)
      ? JSON.parse(e.parameter.payload)
      : JSON.parse(e.postData.contents);
    const action = data.action || "";

    if (action === "receiveStats") {
      const cfg       = getConfig();
      const secretKey = cfg["api_secret_key"] || "";
      if (secretKey && data.api_key !== secretKey) {
        return _json({ ok: false, error: "認証エラー: api_keyが不正です" });
      }
      const url = data.url || cfg["room_url"] || "";
      _writeRecord(url, {
        followers: data.followers,
        following: data.following,
        posts:     data.posts,
        likes:     data.likes,
        rank:      data.rank || "",
      });
      if (url) saveSetting("room_url", url);
      return _json({ ok: true });
    }

    return _json({ ok: false, error: "unknown action" });
  } catch (err) {
    return _json({ ok: false, error: err.toString() });
  }
}

function _fetchDashboardHtml() {
  try {
    const res = UrlFetchApp.fetch(DASHBOARD_HTML_URL, { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) return res.getContentText();
  } catch (e) {
    // 下のフォールバックを返す
  }
  return "<p>ダッシュボードの読み込みに失敗しました。しばらくしてから再度開き直してください。</p>";
}

function getData(scope) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DATA);
  if (!sheet) return { error: "シート「" + SHEET_DATA + "」が見つかりません" };

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { rows: [], latest: null, prev: null };

  const raw      = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const scopeDays = { "1w": 7, "1m": 30, "3m": 90, "1y": 365 };
  const days     = scopeDays[scope] || 365;
  const cutoff   = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const rows = raw
    .filter(r => r[0] && new Date(r[0]) >= cutoff)
    .map(r => ({
      date:      Utilities.formatDate(new Date(r[0]), "Asia/Tokyo", "yyyy-MM-dd HH:mm"),
      followers: r[2] !== "" ? Number(r[2]) : null,
      following: r[3] !== "" ? Number(r[3]) : null,
      posts:     r[4] !== "" ? Number(r[4]) : null,
      likes:     r[5] !== "" ? Number(r[5]) : null,
      rank:      r[6] || null,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const sorted = raw
    .filter(r => r[0])
    .sort((a, b) => new Date(b[0]) - new Date(a[0]));

  const toObj = r => ({
    date:      Utilities.formatDate(new Date(r[0]), "Asia/Tokyo", "yyyy-MM-dd HH:mm"),
    followers: r[2] !== "" ? Number(r[2]) : null,
    following: r[3] !== "" ? Number(r[3]) : null,
    posts:     r[4] !== "" ? Number(r[4]) : null,
    likes:     r[5] !== "" ? Number(r[5]) : null,
    rank:      r[6] || null,
  });

  return {
    rows,
    latest: sorted.length > 0 ? toObj(sorted[0]) : null,
    prev:   sorted.length > 1 ? toObj(sorted[1]) : null,
  };
}

/**
 * ダッシュボードの「更新」ボタンから呼ばれる。GASはROOMへ直接アクセスできないため、
 * ここでは「記録」シートを再読み込みするだけ（ショートカットで新しく送信された分を反映する）。
 */
function refreshView() {
  return getData('1y');
}

function getConfig() {
  const sheet = _settingsSheet();
  const data  = sheet.getDataRange().getValues();
  const cfg   = {};
  data.forEach(row => {
    if (row[0] && row[0] !== "キー") {
      cfg[String(row[0])] = String(row[1] !== undefined ? row[1] : "");
    }
  });
  return cfg;
}

function _writeRecord(url, stats) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_DATA);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_DATA);
    sheet.getRange(1, 1, 1, 7).setValues([["日時","URL","フォロワー数","フォロー数","投稿数","いいね数","ランク"]]);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 7).setValues([["日時","URL","フォロワー数","フォロー数","投稿数","いいね数","ランク"]]);
  }

  const today   = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd");
  const now     = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd HH:mm:ss");
  const lastRow = sheet.getLastRow();

  if (lastRow >= 2) {
    const dates = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = dates.length - 1; i >= 0; i--) {
      const rowDate = Utilities.formatDate(new Date(dates[i][0]), "Asia/Tokyo", "yyyy-MM-dd");
      if (rowDate === today) {
        sheet.getRange(i + 2, 1, 1, 7).setValues([[now, url,
          stats.followers != null ? Number(stats.followers) : "",
          stats.following != null ? Number(stats.following) : "",
          stats.posts     != null ? Number(stats.posts)     : "",
          stats.likes     != null ? Number(stats.likes)     : "",
          stats.rank      || ""]]);
        return;
      }
    }
  }

  sheet.appendRow([now, url,
    stats.followers != null ? Number(stats.followers) : "",
    stats.following != null ? Number(stats.following) : "",
    stats.posts     != null ? Number(stats.posts)     : "",
    stats.likes     != null ? Number(stats.likes)     : "",
    stats.rank      || ""]);
}

function _upsertSetting(sheet, key, value) {
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function _settingsSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SETTINGS);
    sheet.getRange(1, 1, 1, 2).setValues([["キー", "値"]]);
    sheet.getRange(2, 1, 2, 2).setValues([
      ["room_url", ""],
      ["api_secret_key", ""],
    ]);
  }
  return sheet;
}

/**
 * 汎用の設定保存関数。UI（ダッシュボード）側に新しい入力項目を追加した時、
 * Code.js側を触らずにこれを呼ぶだけで、そのユーザーの「設定」シートに保存できる。
 * ここに保存される値は各ユーザーの中だけに閉じており、開発者側には送られない。
 */
function saveSetting(key, value) {
  const sheet = _settingsSheet();
  _upsertSetting(sheet, String(key), String(value));
  return { ok: true };
}

/**
 * ユーザーが自分の意思で差し出した情報（メールアドレス等）を、開発者管理の受け皿に送る汎用関数。
 * トラッキングデータとは違い、これは開発者側に届く。INFO_FORM_URL / INFO_FORM_ENTRY_MAP が
 * 未設定のキーは何もせず終わる（安全側のデフォルト）。
 */
function submitInfo(key, value) {
  const entry = INFO_FORM_ENTRY_MAP[key];
  if (INFO_FORM_URL && entry && value) {
    try {
      UrlFetchApp.fetch(INFO_FORM_URL, {
        method: "post",
        payload: { [entry]: String(value) },
        muteHttpExceptions: true,
      });
    } catch (e) {
      Logger.log("submitInfo失敗: " + e);
    }
  }
  return { ok: true };
}

/**
 * 初回のROOM URL入力フォームから呼ばれる。表示用にROOM URLを保存するだけで、
 * GAS側からの取得は行わない（データはiOSショートカットからのdoPostで届く）。
 * google.script.run経由（＝Webアプリとして実行されている）なのでgetUi()の制約を受けない。
 */
function completeOnboarding(roomUrl, optinEmail) {
  roomUrl = String(roomUrl || "").trim();
  if (!roomUrl) {
    throw new Error("ROOM URLを入力してください");
  }
  saveSetting("room_url", roomUrl);
  if (optinEmail) {
    submitInfo("email", optinEmail);
  }
  return getData('1y');
}

/**
 * シンプルトリガー。コピーしたスプレッドシートを開いた瞬間に自動実行され、
 * 「設定」シートを（room_url等の空欄付きで）先に作っておく。
 * 権限承認が済んでいなくても、同じスプレッドシート内の操作だけなら実行できる。
 */
function onOpen(e) {
  _settingsSheet();
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
