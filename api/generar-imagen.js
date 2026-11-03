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

    const modelosParaProbar = [
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.8-flash"
    ];

    let data = null;
    let ultimoError = null;

    for (const modelName of modelosParaProbar) {
      try {
        console.log(`Intentando conectar con el modelo: ${modelName} (dando hasta 2 minutos)...`);
        const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 segundos (2 minutos) por intento

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
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

        clearTimeout(timeoutId);
        data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.log(`¡Éxito total con el modelo ${modelName}!`);
          break;
        } else {
          ultimoError = data.error?.message || `Error HTTP: ${response.status}`;
          console.warn(`Falló el modelo ${modelName}: ${ultimoError}. Probando siguiente...`);
        }
      } catch (err) {
        ultimoError = err.message;
        console.warn(`Excepción o Timeout con el modelo ${modelName}: ${ultimoError}. Probando siguiente...`);
      }
    }

    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error(ultimoError || 'Todos los modelos fallaron o agotaron el tiempo máximo de espera.');
    }

    return res.status(200).json({ success: true, image: responseText });

  } catch (error) {
    console.error("Detalle del error crítico:", error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
}
