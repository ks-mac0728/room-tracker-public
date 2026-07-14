const SHEET_DATA     = "記録";
const SHEET_SETTINGS = "設定";

function doGet(e) {
  const tmpl = HtmlService.createTemplateFromFile('Index');
  tmpl.baseUrl     = ScriptApp.getService().getUrl();
  tmpl.initialData = JSON.stringify(getData('1y'));
  const output = tmpl.evaluate();
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  return output;
}

function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const action = data.action || "";

    if (action === "receiveStats") {
      const cfg       = getConfig();
      const secretKey = cfg["api_secret_key"] || "";
      if (secretKey && data.api_key !== secretKey) {
        return _json({ ok: false, error: "認証エラー: api_keyが不正です" });
      }
      _writeRecord(data.url || "", {
        followers: data.followers,
        following: data.following,
        posts:     data.posts,
        likes:     data.likes,
        rank:      data.rank || "",
      });
      return _json({ ok: true });
    }

    return _json({ ok: false, error: "unknown action" });
  } catch(err) {
    return _json({ ok: false, error: err.toString() });
  }
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
  }
  return sheet;
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
