const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const result = document.getElementById("result");

let base64Image = "";

imageInput.addEventListener("change", () => {

  const file = imageInput.files[0];

  const reader = new FileReader();

  reader.onload = function(e){
    base64Image = e.target.result;

    preview.src = base64Image;
  };

  reader.readAsDataURL(file);
});

analyzeBtn.addEventListener("click", async () => {

  result.innerHTML = "Analyzing...";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {

    method:"POST",

    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer YOUR_OPENAI_API_KEY"
    },

    body: JSON.stringify({

      model:"gpt-4.1-mini",

      messages:[
        {
          role:"user",
          content:[
            {
              type:"text",
              text:`
              Analyze this food image.

              Return:
              - food name
              - estimated calories
              - protein
              - carbs
              - fat

              format as JSON
              `
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

      max_tokens:300
    })
  });

  const data = await response.json();

  console.log(data);

  const text = data.choices[0].message.content;

  result.innerHTML = `
    <pre>${text}</pre>
  `;
});