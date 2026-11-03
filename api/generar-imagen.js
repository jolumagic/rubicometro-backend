import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { imageBase64, prompt } = req.body;
    
    // Inicializar con tu clave de entorno
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Usar el modelo compatible con imágenes y texto (ej. gemini-1.5-flash o gemini-2.5-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Limpiar el formato base64 si trae la cabecera data:image/...
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const result = await model.generateContent([
      prompt || "A realistic photograph of a Rubik's cube on a magical table",
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const responseText = result.response.text();

    return res.status(200).json({
      success: true,
      image: responseText // O el formato en el que devuelvas la imagen generada
    });

  } catch (error) {
    console.error("Error en servidor:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
