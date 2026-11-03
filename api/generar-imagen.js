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
    const { imageBase64, prompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Falta la imagen de referencia' });
    }

    const promptFinal = prompt || "A professional studio product photograph of this exact Rubik's cube sitting on a polished wooden table, vibrant colors, sharp focus, 8k resolution, cinematic lighting";
    
    console.log("Enviando imagen y prompt al servicio de IA...");

    // Petición POST estructurada para que la IA procese la imagen de entrada (Img2Img)
    const aiResponse = await fetch('https://image.pollinations.ai/prompt/' + encodeURIComponent(promptFinal), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageBase64,
        private: true,
        enhance: true,
        nologo: true,
        model: 'flux'
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`Error en la IA de Pollinations: ${aiResponse.status}`);
    }

    const imageBuffer = await aiResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    console.log("¡Imagen generada tomando como base tu cubo!");

    return res.status(200).json({ 
      success: true, 
      image: base64Image, 
      mimeType: 'image/jpeg' 
    });

  } catch (error) {
    console.error("Error crítico en Vercel:", error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
}
