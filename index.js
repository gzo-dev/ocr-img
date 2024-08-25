const express = require('express');
const Tesseract = require('tesseract.js');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const cors= require("cors")

const app = express();
app.use(cors())
const port = 3000;

const cropX = 110; // Vị trí X bắt đầu cắt
const cropY = 270; // Vị trí Y bắt đầu cắt
const cropWidth =350; // Chiều rộng của phần cắt
const cropHeight = 350; // Chiều cao của phần cắt
// Middleware để phân tích JSON trong body của yêu cầu
app.use(express.json());

app.post('/', async (req, res) => {
  const { imageSrc, season, index } = req.body;

  if (!imageSrc || cropX === undefined || cropY === undefined || !cropWidth || !cropHeight) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const image = await loadImage(imageSrc);
    const canvas = createCanvas(cropWidth, cropHeight);
    const ctx = canvas.getContext('2d');

    // Cắt ảnh
    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    // Chuyển canvas thành buffer để xử lý OCR
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('cropped_image.png', buffer);
    // Nhận diện văn bản từ ảnh đã cắt
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
        // logger: m => console.log(m),
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    });

    // Trả về kết quả nhận diện văn bản
    res.json({ text, index });

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
