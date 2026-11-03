import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Configurar cabeceras CORS para permitir peticiones desde CodePen
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Token',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
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

    // Inicializar el SDK clásico de Google Gen AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Usamos el modelo con sufijo -latest para asegurar compatibilidad automática con la API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Limpiar el prefijo data:image/... si lo trae el string en base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      },
    };

    // Generar contenido con la imagen y el texto
    const result = await model.generateContent([
      prompt || "A realistic photograph of a Rubik's cube on a magical table",
      imagePart
    ]);

    const responseText = result.response.text();

    return res.status(200).json({
      success: true,
      image: responseText
    });

  } catch (error) {
    console.error("Detalle del error con Gemini:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || error.toString() 
    });
  }
}
