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

    // Intentamos hasta 2 rondas completas si hay alta demanda general
    for (let intento = 1; intento <= 2; intento++) {
      console.log(`--- Ronda de intentos ${intento} ---`);

      for (const modelName of modelosParaProbar) {
        try {
          console.log(`Probando modelo gratuito: ${modelName}...`);
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
                    { text: prompt || "Analyze this Rubik's cube state and describe a realistic version of it." },
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
            console.log(`¡Éxito con el modelo ${modelName} en la ronda ${intento}!`);
            break;
          } else {
            ultimoError = data.error?.message || `Error HTTP: ${response.status}`;
            console.warn(`Modelo ${modelName} ocupado: ${ultimoError}`);
          }
        } catch (err) {
          ultimoError = err.message;
          console.warn(`Excepción en ${modelName}: ${ultimoError}`);
        }
      }

      // Si ya encontramos respuesta, salimos del bucle de rondas
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        break;
      }

      // Si llegamos aquí y falló todo, esperamos 3 segundos antes de la segunda ronda para dejar respirar a la API
      if (intento < 2) {
        console.log("Modelos saturados temporalmente. Esperando 3 segundos para reintentar...");
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error(ultimoError || 'Los modelos gratuitos siguen experimentando alta demanda. Por favor, prueba de nuevo en un minuto.');
    }

    return res.status(200).json({ success: true, image: responseText });

  } catch (error) {
    console.error("Detalle del error crítico:", error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
}
