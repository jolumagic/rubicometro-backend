cat << 'EOF' > api/generar-imagen.js
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { imageBase64, prompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Falta la imagen de origen' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const aiPrompt = prompt || "Convierte la imagen de referencia en una fotografía realista tomada con un teléfono móvil. El cubo de Rubik debe estar apoyado sobre una mesa de madera, con iluminación ambiental natural, sombras de contacto, reflejos sutiles y materiales de plástico negro realistas. Conserva exactamente la forma, la orientación y la disposición de todas las pegatinas de colores del cubo de referencia.";

    const response = await ai.models.generateContent({
      model: 'imagen-3.0-generate-002',
      contents: [
        {
          role: 'user',
          parts: [
            { text: aiPrompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64
              }
            }
          ]
        }
      ]
    });

    const candidatePart = response.candidates?.[0]?.content?.parts?.[0];
    
    if (candidatePart?.inlineData) {
      return res.status(200).json({
        success: true,
        image: candidatePart.inlineData.data,
        mimeType: candidatePart.inlineData.mimeType
      });
    } else {
      return res.status(500).json({ error: 'El modelo no devolvió un bloque de imagen válido' });
    }

  } catch (error) {
    console.error('Error generando imagen:', error);
    return res.status(500).json({ error: error.message || 'Error en el servidor de IA' });
  }
}
EOF
