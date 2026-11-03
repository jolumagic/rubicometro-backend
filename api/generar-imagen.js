export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método no permitido' });

  try {
    // Ahora recibimos directamente la descripción textual exacta generada por tu CodePen
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Falta el prompt descriptivo' });
    }

    const randomSeed = Math.floor(Math.random() * 999999999);
    
    // Prompt optimizado con la descripción detallada que manda tu frontend
    const fullPrompt = `A professional studio product photograph of a classic Rubik's cube sitting on a polished wooden table, cinematic lighting, 8k resolution, photorealistic. ${prompt}`;
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&seed=${randomSeed}&nologo=true&model=flux`;

    console.log("Generando imagen basada en la descripción exacta del cubo...");

    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Error al generar imagen: ${response.status}`);

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    return res.status(200).json({ 
      success: true, 
      image: base64Image, 
      mimeType: 'image/jpeg' 
    });

  } catch (error) {
    console.error("Error en Vercel:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
