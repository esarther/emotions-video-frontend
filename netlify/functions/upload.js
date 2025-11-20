// Netlify Function pour l'upload de médias vers Cloudinary et sauvegarde dans Supabase
// NOTE: Cette fonction nécessite les packages suivants :
// npm install cloudinary busboy @supabase/supabase-js

let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
  // Configuration Cloudinary (à mettre dans les variables d'environnement Netlify)
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (e) {
  console.warn('Cloudinary not installed. Install with: npm install cloudinary');
}

let supabase;
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (e) {
  console.warn('Supabase not installed. Install with: npm install @supabase/supabase-js');
}

exports.handler = async (event, context) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Seulement accepter POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parser le FormData avec busboy (meilleur pour Netlify Functions)
    let busboy;
    try {
      busboy = require('busboy');
    } catch (e) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Backend dependencies not installed. Please install: npm install busboy cloudinary',
        }),
      };
    }
    
    return new Promise((resolve) => {
      const fields = {};
      let file = null;
      const fileChunks = [];

      // Décoder le body si nécessaire
      let bodyBuffer;
      if (event.isBase64Encoded && event.body) {
        bodyBuffer = Buffer.from(event.body, 'base64');
      } else if (event.body) {
        bodyBuffer = Buffer.isBuffer(event.body) ? event.body : Buffer.from(event.body);
      } else {
        return resolve({
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'No body provided' }),
        });
      }

      const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
      const bb = busboy({ headers: { 'content-type': contentType } });

      bb.on('field', (name, value) => {
        fields[name] = value;
      });

      bb.on('file', (name, fileStream, info) => {
        if (name === 'media') {
          const { filename, encoding, mimeType } = info;
          file = {
            originalFilename: filename,
            mimetype: mimeType,
            encoding: encoding,
            chunks: []
          };

          fileStream.on('data', (chunk) => {
            fileChunks.push(chunk);
          });

          fileStream.on('end', () => {
            file.buffer = Buffer.concat(fileChunks);
            file.size = file.buffer.length;
          });
        } else {
          // Ignorer les autres fichiers
          fileStream.resume();
        }
      });

      bb.on('finish', async () => {
        try {
          if (!file) {
            return resolve({
              statusCode: 400,
              headers: {
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({ error: 'No file provided' }),
            });
          }

          // Extraire les données du formulaire
          const projectId = fields.projectId || fields.projectId?.[0];
          const userEmail = fields.userEmail || fields.userEmail?.[0];
          const chapter = fields.chapter || fields.chapterName || fields.chapter?.[0] || fields.chapterName?.[0];
          
          let chapterStyle = {};
          if (fields.chapterStyle) {
            try {
              const styleValue = Array.isArray(fields.chapterStyle) ? fields.chapterStyle[0] : fields.chapterStyle;
              chapterStyle = typeof styleValue === 'string' ? JSON.parse(styleValue) : styleValue;
            } catch (e) {
              console.warn('Error parsing chapterStyle:', e);
            }
          }

          console.log('Upload request:', {
            projectId,
            userEmail,
            chapter,
            fileName: file.originalFilename || 'unknown',
            fileSize: file.size,
            fileType: file.mimetype || 'unknown',
          });

          // Utiliser le buffer du fichier
          if (!file.buffer || file.buffer.length === 0) {
            throw new Error('File buffer is empty');
          }

          // Upload vers Cloudinary
          const uploadResult = await new Promise((resolveUpload, rejectUpload) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: 'auto',
                folder: `emotions-video/${projectId}/${chapter}`,
                public_id: `${Date.now()}-${(file.originalFilename || 'file').replace(/\.[^/.]+$/, '')}`,
              },
              (error, result) => {
                if (error) {
                  console.error('Cloudinary upload error:', error);
                  rejectUpload(error);
                } else {
                  resolveUpload(result);
                }
              }
            );
            
            uploadStream.end(file.buffer);
          });

          // Sauvegarder dans Supabase si configuré
          let supabaseRecord = null;
          if (supabase && projectId && userEmail) {
            try {
              const { data, error } = await supabase
                .from('media_files')
                .insert({
                  project_id: projectId,
                  user_email: userEmail,
                  file_name: file.originalFilename || 'unknown',
                  file_type: uploadResult.resource_type === 'image' ? 'image' : 'video',
                  file_size: uploadResult.bytes,
                  cloudinary_url: uploadResult.secure_url,
                  chapter: chapter || null,
                  chapter_style: chapterStyle || null,
                  duration: uploadResult.duration || null,
                  resolution: uploadResult.width && uploadResult.height 
                    ? `${uploadResult.width}x${uploadResult.height}` 
                    : null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (error) {
                console.error('Supabase insert error:', error);
                // Ne pas faire échouer l'upload si Supabase échoue
              } else {
                supabaseRecord = data;
                console.log('✅ Saved to Supabase:', data.id);
              }
            } catch (supabaseError) {
              console.error('Supabase error:', supabaseError);
              // Ne pas faire échouer l'upload si Supabase échoue
            }
          }

          // Préparer la réponse
          const response = {
            success: true,
            files: [
              {
                cloudinaryUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                originalName: file.originalFilename || 'unknown',
                fileSize: uploadResult.bytes,
                fileType: uploadResult.resource_type,
                width: uploadResult.width,
                height: uploadResult.height,
                duration: uploadResult.duration, // Pour les vidéos
                supabaseId: supabaseRecord?.id || null, // ID Supabase si sauvegardé
              },
            ],
          };

          resolve({
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(response),
          });
        } catch (error) {
          console.error('Upload error:', error);
          resolve({
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: error.message || 'Internal server error',
              details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            }),
          });
        }
      });

      bb.on('error', (err) => {
        console.error('Busboy parsing error:', err);
        resolve({
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Error parsing form data: ' + err.message }),
        });
      });

      // Parser le body avec busboy
      bb.end(bodyBuffer);
    });
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error',
      }),
    };
  }
};

