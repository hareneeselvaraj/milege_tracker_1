import { gapi } from 'gapi-script';

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.file";

export const initClient = (clientId) => {
  console.log('gdrive.js: initClient for ID:', clientId);
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', () => {
      console.log('gapi.load: client:auth2 loaded');
      gapi.client.init({
        clientId: clientId,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      }).then(() => {
        console.log('gapi.client.init: success');
        resolve(gapi.auth2.getAuthInstance());
      }).catch(err => {
        console.error('gapi.client.init: error', err);
        reject(err);
      });
    });
  });
};

export const getFile = async (fileName) => {
  console.log('gdrive.js: getFile searching for:', fileName);
  const response = await gapi.client.drive.files.list({
    q: `name = '${fileName}' and trashed = false`,
    fields: 'files(id, name)',
  });
  
  const files = response.result.files;
  console.log('Files found count:', files?.length || 0);
  if (files && files.length > 0) {
    const fileId = files[0].id;
    console.log('Fetching file content for ID:', fileId);
    const fileResponse = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    return { id: fileId, data: fileResponse.result };
  }
  return null;
};

export const createFile = async (fileName, data) => {
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const contentType = 'application/json';
  const metadata = {
    'name': fileName,
    'mimeType': contentType,
  };

  const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + contentType + '\r\n\r\n' +
      JSON.stringify(data) +
      close_delim;

  const request = gapi.client.request({
      'path': '/upload/drive/v3/files',
      'method': 'POST',
      'params': {'uploadType': 'multipart'},
      'headers': {
        'Content-Type': 'multipart/related; boundary="' + boundary + '"'
      },
      'body': multipartRequestBody});
  
  return request.execute();
};

export const updateFile = async (fileId, data) => {
  const request = gapi.client.request({
    'path': `/upload/drive/v3/files/${fileId}`,
    'method': 'PATCH',
    'params': {'uploadType': 'media'},
    'headers': {
      'Content-Type': 'application/json'
    },
    'body': JSON.stringify(data)
  });
  
  return request.execute();
};
