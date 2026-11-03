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

    const promptFinal = prompt || "A professional studio product photograph of this Rubik's cube sitting on a polished wooden table, vibrant colors, sharp focus, 8k resolution, cinematic lighting";
    
    console.log("Enviando imagen de referencia y prompt a la IA...");

    // Usamos el endpoint de Pollinations aceptando imagen base64 como modelo de referencia (Img2Img)
    const response = await fetch('https://image.pollinations.ai/prompt/' + encodeURIComponent(promptFinal), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: imageBase64, // Aquí va la captura real de tu cubo
        width: 1024,
        height: 1024,
        nologo: true,
        model: 'flux'
      })
    });

    if (!response.ok) {
      // Si el servicio por POST falla con imagen, recurrimos al método seguro URL GET con seed aleatoria
      const randomSeed = Math.floor(Math.random() * 1000000);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptFinal)}?width=1024&height=1024&seed=${randomSeed}&nologo=true&model=flux`;
      
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) throw new Error("Error al generar la imagen con IA");
      
      const buffer = await fallbackRes.arrayBuffer();
      const base64Img = Buffer.from(buffer).toString('base64');
      return res.status(200).json({ success: true, image: base64Img, mimeType: 'image/jpeg' });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    console.log("¡Imagen generada tomando como modelo tu cubo!");

    return res.status(200).json({ success: true, image: base64Image, mimeType: 'image/jpeg' });

  } catch (error) {
    console.error("Error crítico en Vercel:", error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
}
