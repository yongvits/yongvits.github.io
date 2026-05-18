const cameraInput = document.getElementById("cameraInput");
const galleryInput = document.getElementById("galleryInput");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const result = document.getElementById("result");
const loading = document.getElementById("loading");
const setKeyBtn = document.getElementById("setKeyBtn");

let base64Image = "";
let imageMimeType = "";

/* -------------------- */
/* API KEY (Gemini)     */
/* -------------------- */
function getApiKey() {
  let key = localStorage.getItem("GEMINI_API_KEY");
  if (!key) {
    key = prompt("Enter Gemini API Key");
    if (key) {
      localStorage.setItem("GEMINI_API_KEY", key);
    }
  }
  return key;
}

setKeyBtn.addEventListener("click", () => {
  const key = prompt("Enter Gemini API Key");
  if (key) {
    localStorage.setItem("GEMINI_API_KEY", key);
    alert("Gemini API Key Saved!");
  }
});

/* -------------------- */
/* IMAGE PROCESSING     */
/* -------------------- */
function loadImage(input) {
  const file = input.files[0];
  if (!file) return;

  // เก็บประเภทของไฟล์ภาพเพื่อส่งให้ Gemini (เช่น image/jpeg หรือ image/png)
  imageMimeType = file.type || "image/jpeg"; 

  const reader = new FileReader();
  reader.onload = function(e) {
    base64Image = e.target.result;
    preview.src = base64Image;
    preview.style.display = "block";
    result.innerHTML = "";
  };
  reader.readAsDataURL(file);
}

cameraInput.addEventListener("change", () => loadImage(cameraInput));
galleryInput.addEventListener("change", () => loadImage(galleryInput));

/* -------------------- */
/* ANALYZE (Gemini)     */
/* -------------------- */
analyzeBtn.addEventListener("click", analyzeFood);

async function analyzeFood() {
  const API_KEY = getApiKey();

  if (!API_KEY) {
    alert("No Gemini API Key found!");
    return;
  }

  if (!base64Image) {
    alert("กรุณาเลือกรูปอาหารก่อนครับ");
    return;
  }

  loading.classList.remove("hidden");
  result.innerHTML = "";

  try {
    // ตัดส่วนหัว data:image/...;base64, ออกให้เหลือแต่ข้อมูล
    const imageBase64Data = base64Image.split(",")[1];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `วิเคราะห์อาหารในภาพนี้ให้ละเอียด
รูปแบบ:
{
  "foods":[
    {
      "name":"ชื่ออาหาร",
      "calories":500,
      "protein":20,
      "carbs":50,
      "fat":15
    }
  ],
  "total_calories":500
}
ถ้าเป็นอาหารไทยให้ตอบชื่อเป็นภาษาไทย`
                },
                {
                  inline_data: {
                    mime_type: imageMimeType, // ใช้ Mime Type ที่ตรงกับรูปจริง
                    data: imageBase64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            response_mime_type: "application/json" // ⭐️ บังคับให้ Gemini ตอบกลับเป็น JSON ล้วนๆ ทันที
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ API");
    }

    const rawContent = data.candidates[0].content.parts[0].text;
    const json = JSON.parse(rawContent);

    renderFoods(json);

  } catch (err) {
    console.error(err);
    result.innerHTML = `
      <div class="error">
❌ ${err.message}
      </div>
    `;
  }

  loading.classList.add("hidden");
}

/* -------------------- */
/* RENDER UI            */
/* -------------------- */
function renderFoods(data) {
  result.innerHTML = "";

  data.foods.forEach(food => {
    result.innerHTML += `
      <div class="food-card">
        <h2>${food.name}</h2>
        <div class="kcal">${food.calories} kcal</div>
        <div class="macros">
          <div class="macro">
            🥩<br>${food.protein}g
          </div>
          <div class="macro">
            🍚<br>${food.carbs}g
          </div>
          <div class="macro">
            🧈<br>${food.fat}g
          </div>
        </div>
      </div>
    `;
  });

  result.innerHTML += `
    <div class="total">
      <div>Total Calories</div>
      <h1>${data.total_calories}</h1>
      <div>kcal</div>
    </div>
  `;
}
