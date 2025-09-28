const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const result = document.getElementById('result');
const optionGrid = document.getElementById('option-grid');
const callBtn = document.getElementById('callBtn');
const emailBtn = document.getElementById('emailBtn');
const outputDiv = document.getElementById('output');
const prefixInput = document.getElementById('prefix');
const suffixInput = document.getElementById('suffix');
let numbers = '';

// Function to format and set phone number
function set_phone_number() {
  phoneNumber = numbers;
  if (prefixInput.value && prefixInput.style.display !== 'none') {
    phoneNumber = prefixInput.value + phoneNumber;
  }
  if (suffixInput.value && suffixInput.style.display !== 'none') {
    phoneNumber = phoneNumber + suffixInput.value;
  }
  callBtn.style.display = 'inline-block';
  callBtn.textContent = `Dial ${phoneNumber}`;
  callBtn.onclick = () => {
    window.location.href = `tel:${phoneNumber}`;
  };
}

// Save prefix and suffix to localStorage on change
prefixInput.addEventListener('input', () => {
  localStorage.setItem('ocr_prefix', prefixInput.value);
  set_phone_number();
});
suffixInput.addEventListener('input', () => {
  localStorage.setItem('ocr_suffix', suffixInput.value);
  set_phone_number();
});

// Access the device camera and stream to video element
navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: { ideal: 'environment' }
  }
})
  .then(stream => video.srcObject = stream)
  .catch(err => console.error("Camera access error:", err));

// Capture frame and perform OCR
function capture() {
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const scanWidth = canvas.width * 0.8;
  const scanHeight = canvas.height * 0.3;
  const scanX = canvas.width * 0.1;
  const scanY = canvas.height * 0.35;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = scanWidth;
  croppedCanvas.height = scanHeight;
  const croppedCtx = croppedCanvas.getContext('2d');
  croppedCtx.drawImage(canvas, scanX, scanY, scanWidth, scanHeight, 0, 0, scanWidth, scanHeight);

  Tesseract.recognize(croppedCanvas, 'eng', {
    logger: m => console.log(m)
  }).then(({ data: { text } }) => {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    const textMatch = text.match(/[a-zA-Z]{2,}/g);
    const numberMatch = text.match(/\d+/g);

    if (emailMatch && emailMatch.length > 0) {
      emailBtn.style.display = 'inline-block';
      emailBtn.textContent = `Email ${emailMatch[0]}`;
      emailBtn.onclick = () => {
        window.location.href = `mailto:${emailMatch[0]}`;
      };
    }
    if (numberMatch && numberMatch.length > 0) {
      numbers = numberMatch.join('');
      if (numbers.length == 7 || numbers.length == 10 || numbers.length == 11) {
        result.textContent = `Phone number ${numbers}`;
        prefixInput.style.display = 'none';
        suffixInput.style.display = 'none';
        localStorage.setItem('ocr_prefix', '');
        localStorage.setItem('ocr_suffix', '');
        set_phone_number();
      } else if (numbers.length >= 12) {
        result.textContent = `Special phone number ${numbers}`;
        prefixInput.value = localStorage.getItem('ocr_prefix') || '';
        suffixInput.value = localStorage.getItem('ocr_suffix') || '';
        prefixInput.style.display = '';
        suffixInput.style.display = 'inline-block';
        set_phone_number();
      } else {
        prefixInput.style.display = 'none';
        suffixInput.style.display = 'none';
        result.textContent = `Numbers ${numbers}`;
        callBtn.style.display = 'none';
      }
    }
    
    if (textMatch && textMatch.length > 0) {
      console.log("Extracted text:", text);
    } 
    
    if (numberMatch || textMatch || emailMatch) {
      optionGrid.style.display = 'grid';
    } else {
      result.textContent = 'No content found';
      optionGrid.style.display = 'none';
    }
  });
}

