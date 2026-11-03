export default async function handler(req, res) {
  // Configurar cabeceras CORS para permitir peticiones desde CodePen
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder de inmediato a las peticiones OPTIONS (preflight de CORS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { imageBase64, prompt } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Falta la imagen en base64' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('La variable GEMINI_API_KEY no está configurada en Vercel');
    }

    // Limpiar el prefijo data:image/... si lo trae el string en base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // URL usando el modelo específico para visión (imágenes) en la API v1
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt || "A realistic photograph of a Rubik's cube on a magical table" },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Error HTTP: ${response.status}`);
    }

    // Extraer la respuesta del texto generado por Gemini
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('La respuesta de Gemini no contiene texto válido.');
    }

    return res.status(200).json({
      success: true,
      image: responseText
    });

  } catch (error) {
    console.error("Detalle del error con fetch directo:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || error.toString() 
    });
  }
}
