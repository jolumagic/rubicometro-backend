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
    const promptFinal = prompt || "A hyper-realistic photograph of a Rubik's cube on a wooden table, cinematic lighting, 8k resolution";

    // Codificamos el prompt para incluirlo de forma segura en la URL de generación gratuita
    const encodedPrompt = encodeURIComponent(promptFinal);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;

    console.log("Generando imagen mediante servicio gratuito externo...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(imageUrl, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error al generar la imagen (${response.status})`);
    }

    // Convertimos la respuesta binaria de la imagen a Base64 para enviarla a tu CodePen
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageOutput = `data:image/jpeg;base64,${base64Image}`;

    console.log("¡Imagen generada y convertida con éxito!");

    return res.status(200).json({ success: true, image: imageOutput });

  } catch (error) {
    console.error("Detalle del error crítico:", error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
}
