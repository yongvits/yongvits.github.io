const cameraInput =
  document.getElementById("cameraInput");

const galleryInput =
  document.getElementById("galleryInput");

const preview =
  document.getElementById("preview");

const analyzeBtn =
  document.getElementById("analyzeBtn");

const result =
  document.getElementById("result");

const loading =
  document.getElementById("loading");

const setKeyBtn =
  document.getElementById("setKeyBtn");

let base64Image = "";

/* -------------------- */
/* API KEY */
/* -------------------- */

function getApiKey(){

  let key =
    localStorage.getItem(
      "GEMINI_API_KEY"
    );

  if(!key){

    key = prompt(
      "Enter Gemini API Key"
    );

    if(key){

      localStorage.setItem(
        "GEMINI_API_KEY",
        key
      );
    }
  }

  return key;
}

setKeyBtn.addEventListener(
  "click",
  () => {

    const key = prompt(
      "Enter Gemini API Key"
    );

    if(key){

      localStorage.setItem(
        "GEMINI_API_KEY",
        key
      );

      alert("Gemini API Key Saved");
    }
  }
);

/* -------------------- */
/* IMAGE */
/* -------------------- */

function loadImage(input){

  const file = input.files[0];

  if(!file) return;

  const reader = new FileReader();

  reader.onload = function(e){

    base64Image = e.target.result;

    preview.src = base64Image;

    preview.style.display = "block";

    result.innerHTML = "";
  };

  reader.readAsDataURL(file);
}

cameraInput.addEventListener(
  "change",
  () => loadImage(cameraInput)
);

galleryInput.addEventListener(
  "change",
  () => loadImage(galleryInput)
);

/* -------------------- */
/* ANALYZE */
/* -------------------- */

analyzeBtn.addEventListener(
  "click",
  analyzeFood
);

async function analyzeFood(){

  const API_KEY =
    getApiKey();

  if(!API_KEY){

    alert("No Gemini API Key");

    return;
  }

  if(!base64Image){

    alert("กรุณาเลือกรูปอาหาร");

    return;
  }

  loading.classList.remove("hidden");

  result.innerHTML = "";

  try{

    /* remove data:image/jpeg;base64, */

    const imageBase64 =
      base64Image.split(",")[1];

    const response = await fetch(

`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,

      {
        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({

          contents:[

            {
              parts:[

                {
                  text:`

วิเคราะห์อาหารในภาพนี้

ตอบ JSON เท่านั้น

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

ถ้าเป็นอาหารไทย
ให้ตอบชื่อไทย

`
                },

                {
                  inline_data:{
                    mime_type:"image/jpeg",
                    data:imageBase64
                  }
                }

              ]
            }

          ],

          generationConfig:{
            temperature:0.4
          }

        })
      }
    );

    const data =
      await response.json();

    console.log(data);

    if(data.error){

      throw new Error(
        data.error.message
      );
    }

    const raw =
      data
      .candidates[0]
      .content
      .parts[0]
      .text;

    const clean =
      raw
      .replace(/```json/g,"")
      .replace(/```/g,"")
      .trim();

    const json =
      JSON.parse(clean);

    renderFoods(json);

  }catch(err){

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
/* RENDER */
/* -------------------- */

function renderFoods(data){

  result.innerHTML = "";

  data.foods.forEach(food => {

    result.innerHTML += `

      <div class="food-card">

        <h2>
          ${food.name}
        </h2>

        <div class="kcal">

          ${food.calories} kcal

        </div>

        <div class="macros">

          <div class="macro">

            🥩<br>
            ${food.protein}g

          </div>

          <div class="macro">

            🍚<br>
            ${food.carbs}g

          </div>

          <div class="macro">

            🧈<br>
            ${food.fat}g

          </div>

        </div>

      </div>

    `;
  });

  result.innerHTML += `

    <div class="total">

      <div>Total Calories</div>

      <h1>

        ${data.total_calories}

      </h1>

      <div>kcal</div>

    </div>

  `;
}