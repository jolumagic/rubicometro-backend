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
    const { prompt } = req.body;
    
    // Un prompt mucho más descriptivo y enfocado a realismo fotográfico de alta calidad
    const promptBase = prompt || "A professional studio product photograph of a classic Rubik's cube sitting on a polished wooden table, vibrant colors, sharp focus, 8k resolution, cinematic lighting";
    
    // Añadimos parámetros de seed aleatoria y mejor calidad para evitar que salgan bloques deformes
    const randomSeed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(promptBase);
    
    // Usamos el modelo 'flux' dentro de Pollinations si está disponible o forzamos alta definición
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&nologo=true&model=flux`;

    console.log("Generando imagen de alta calidad...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(imageUrl, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error al generar la imagen (${response.status})`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageOutput = `data:image/jpeg;base64,${base64Image}`;

    console.log("¡Imagen mejorada con éxito!");

    return res.status(200).json({ success: true, image: imageOutput });

  } catch (error) {
    console.error("Detalle del error crítico:", error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
}
