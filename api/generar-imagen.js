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
    const hfToken = process.env.HUGGING_FACE_TOKEN;
    if (!hfToken) {
      throw new Error('La variable HUGGING_FACE_TOKEN no está configurada en Vercel');
    }

    const { prompt } = req.body;
    const promptFinal = prompt || "A hyper-realistic photograph of a Rubik's cube on a wooden table, cinematic lighting, 8k resolution";

    // Usamos el nuevo endpoint router oficial de Hugging Face para modelos estables
    const modelUrl = "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0";

    console.log("Conectando con el router moderno de Hugging Face...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
        'Accept': 'image/jpeg'
      },
      signal: controller.signal,
      body: JSON.stringify({ inputs: promptFinal })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error en Hugging Face (${response.status}): ${errText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageOutput = `data:image/jpeg;base64,${base64Image}`;

    console.log("¡Imagen generada con éxito a través del router de Hugging Face!");

    return res.status(200).json({ success: true, image: imageOutput });

  } catch (error) {
    console.error("Detalle del error crítico:", error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
}
