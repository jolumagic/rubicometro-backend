export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método no permitido' });

  try {
    const { imageBase64, prompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Falta la imagen de referencia' });
    }

    const base64Data = imageBase64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    console.log("Enviando petición directa a Hugging Face API...");

    // Llamada HTTP directa al modelo instruct-pix2pix
    const response = await fetch(
      "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt || "A professional studio product photograph of this exact Rubik's cube sitting on a polished wooden table, cinematic lighting, 8k resolution",
          parameters: {
            image: base64Data, // Algunos modelos aceptan la imagen en base64 directamente en el JSON
            num_inference_steps: 25,
            guidance_scale: 7.5
          }
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Hugging Face respondió con estado ${response.status}: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const finalBase64 = Buffer.from(arrayBuffer).toString('base64');

    return res.status(200).json({ 
      success: true, 
      image: finalBase64, 
      mimeType: 'image/jpeg' 
    });

  } catch (error) {
    console.error("Error crítico en Vercel:", error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
}
