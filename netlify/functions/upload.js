const Busboy = require('busboy');
const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let fileData = null;
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    const bb = Busboy({ headers: { 'content-type': contentType } });

    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        fileData = { filename, mimeType, buffer: Buffer.concat(chunks) };
      });
    });

    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    bb.on('error', reject);
    bb.on('finish', () => resolve({ fields, file: fileData }));

    const encoding = event.isBase64Encoded ? 'base64' : 'utf8';
    const body = Buffer.from(event.body || '', encoding);
    bb.end(body);
  });
}

function uploadToCloudinary(buffer, filename, mimeType) {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: process.env.CLOUDINARY_FOLDER || 'emotions-video', filename_override: filename, use_filename: true, unique_filename: false },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    upload.end(buffer);
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { fields, file } = await parseMultipart(event);
    const projectId = fields.projectId || fields.project_id || '';
    const chapterName = fields.chapterName || '';
    const userEmail = fields.userEmail || '';

    console.log('upload request', { projectId, chapterName, userEmail });

    if (!projectId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing projectId' }) };
    }
    if (!file || !file.buffer) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No file uploaded' }) };
    }

    const uploadRes = await uploadToCloudinary(file.buffer, file.filename, file.mimeType);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const insertRes = await supabase
      .from('media_files')
      .insert({ project_id: projectId, original_name: file.filename, cloudinary_url: uploadRes.secure_url })
      .select();

    if (insertRes.error) {
      console.error('supabase insert error', insertRes.error);
      return { statusCode: 500, body: JSON.stringify({ error: insertRes.error.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        projectId,
        chapterName,
        userEmail,
        file: { url: uploadRes.secure_url, public_id: uploadRes.public_id },
        db: insertRes.data,
      }),
    };
  } catch (err) {
    console.error('upload handler error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Upload failed', details: err.message }) };
  }
};
