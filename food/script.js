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

let base64Image = "";

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

analyzeBtn.addEventListener(
  "click",
  analyzeFood
);

async function analyzeFood(){

  if(!base64Image){

    alert("กรุณาเลือกรูปอาหาร");

    return;
  }

  loading.classList.remove("hidden");

  result.innerHTML = "";

  try{

    const response = await fetch(

      "https://api.openai.com/v1/chat/completions",

      {
        method:"POST",

        headers:{
          "Content-Type":"application/json",
          "Authorization":
            `Bearer ${OPENAI_API_KEY}`
        },

        body:JSON.stringify({

          model:"gpt-4.1-mini",

          messages:[

            {
              role:"system",

              content:`

คุณคือ AI วิเคราะห์อาหาร

ให้ตอบ JSON เท่านั้น

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

ประมาณค่าตามภาพจริง

`
            },

            {
              role:"user",

              content:[

                {
                  type:"text",
                  text:"วิเคราะห์อาหารในภาพนี้"
                },

                {
                  type:"image_url",

                  image_url:{
                    url:base64Image
                  }
                }

              ]
            }

          ],

          max_tokens:700

        })
      }
    );

    const data =
      await response.json();

    console.log(data);

    const raw =
      data.choices[0]
      .message
      .content;

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
        ❌ วิเคราะห์อาหารไม่สำเร็จ
      </div>
    `;
  }

  loading.classList.add("hidden");
}

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

          <div class="macro-box">

            <div>🥩</div>

            <div>
              ${food.protein}g
            </div>

            <small>Protein</small>

          </div>

          <div class="macro-box">

            <div>🍚</div>

            <div>
              ${food.carbs}g
            </div>

            <small>Carbs</small>

          </div>

          <div class="macro-box">

            <div>🧈</div>

            <div>
              ${food.fat}g
            </div>

            <small>Fat</small>

          </div>

        </div>

      </div>

    `;
  });

  result.innerHTML += `

    <div class="total-card">

      <div>Total Calories</div>

      <h1>

        ${data.total_calories}

      </h1>

      <div>kcal</div>

    </div>

  `;
}