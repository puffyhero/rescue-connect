var SHEET_NAME = "Data";

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  
  var results = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var payload = JSON.parse(e.postData.contents);
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    if (payload.action === 'updateStatus') {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] == payload.id) {
           var headers = data[0];
           var statusIdx = headers.indexOf('Status');
           if (statusIdx == -1) statusIdx = headers.indexOf('status');
           
           if (statusIdx > -1) {
             sheet.getRange(i + 1, statusIdx + 1).setValue(payload.status);
             return ContentService.createTextOutput(JSON.stringify({result: "updated"}));
           }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({result: "id not found"}));
      
    } else {
      var newRow = [
        payload.id,
        payload.data,
        payload.timestamp,
        payload.status
      ];
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({result: "created"}));
    }
    
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({error: e.toString()}));
  } finally {
    lock.releaseLock();
  }
}