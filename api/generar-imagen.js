const { HfInference } = require('@huggingface/inference');

const inference = new HfInference(process.env.HF_TOKEN);

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
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    console.log("Enviando imagen y prompt a Hugging Face (InstructPix2Pix)...");

    const responseImage = await inference.imageToImage({
      model: "timbrooks/instruct-pix2pix",
      data: blob,
      parameters: {
        prompt: prompt || "A professional studio product photograph of this exact Rubik's cube sitting on a polished wooden table, cinematic lighting, 8k resolution",
        num_inference_steps: 30,
        guidance_scale: 7.5
      }
    });

    const arrayBuffer = await responseImage.arrayBuffer();
    const finalBase64 = Buffer.from(arrayBuffer).toString('base64');

    return res.status(200).json({ 
      success: true, 
      image: finalBase64, 
      mimeType: 'image/jpeg' 
    });

  } catch (error) {
    console.error("Error en Hugging Face:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
