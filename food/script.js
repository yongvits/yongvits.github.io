const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const result = document.getElementById("result");
const loading = document.getElementById("loading");

let base64Image = "";

imageInput.addEventListener("change", () => {

  const file = imageInput.files[0];

  if(!file) return;

  const reader = new FileReader();

  reader.onload = function(e){

    base64Image = e.target.result;

    preview.src = base64Image;

    preview.style.display = "block";
  };

  reader.readAsDataURL(file);
});

analyzeBtn.addEventListener("click", async () => {

  if(!base64Image){
    alert("กรุณาถ่ายรูปก่อน");
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
          "Authorization":`Bearer ${OPENAI_API_KEY}`
        },

        body:JSON.stringify({

          model:"gpt-4.1-mini",

          messages:[
            {
              role:"system",
              content:`
คุณคือ AI วิเคราะห์อาหาร

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

          max_tokens:500
        })
      }
    );

    const data = await response.json();

    console.log(data);

    const raw =
      data.choices[0].message.content;

    const clean =
      raw.replace(/```json/g,"")
         .replace(/```/g,"");

    const json = JSON.parse(clean);

    renderFoods(json);

  }catch(err){

    console.error(err);

    result.innerHTML = `
      <div class="food-card">
        ❌ Error วิเคราะห์อาหาร
      </div>
    `;
  }

  loading.classList.add("hidden");
});

function renderFoods(data){

  result.innerHTML = "";

  data.foods.forEach(food => {

    result.innerHTML += `

      <div class="food-card">

        <h2>${food.name}</h2>

        <div class="kcal">
          ${food.calories} kcal
        </div>

        <div class="macros">

          <div>
            🥩<br>
            ${food.protein}g
          </div>

          <div>
            🍚<br>
            ${food.carbs}g
          </div>

          <div>
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