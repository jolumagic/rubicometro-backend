export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('La variable GEMINI_API_KEY no está configurada en Vercel');
    }

    const { imageBase64, prompt } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Falta la imagen en base64' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Usamos el modelo de imagen dedicado que aparecía en tu lista de Vercel
    const modelName = "gemini-3.1-flash-image";
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt || "Generate a realistic photograph based on this Rubik's cube state" },
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

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Error HTTP: ${response.status}`);
    }

    // Buscamos si la respuesta trae datos binarios en inline_data (imagen generada) o texto
    const candidatePart = data.candidates?.[0]?.content?.parts?.[0];
    
    let imageOutput = null;
    if (candidatePart?.inline_data) {
      // Si el modelo devuelve la imagen directamente en binario/base64
      imageOutput = `data:${candidatePart.inline_data.mime_type};base64,${candidatePart.inline_data.data}`;
    } else if (candidatePart?.text) {
      // Si devuelve texto
      imageOutput = candidatePart.text;
    }

    if (!imageOutput) {
      throw new Error('La respuesta de Gemini no contiene una imagen válida.');
    }

    return res.status(200).json({ success: true, image: imageOutput });

  } catch (error) {
    console.error("Detalle del error crítico:", error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
}
