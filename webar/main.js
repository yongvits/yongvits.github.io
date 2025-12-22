// =======================
// GLOBAL VARIABLES
// =======================
let mindarThree;
let renderer;
let mediaRecorder;
let chunks = [];

// =======================
// START AR (iOS SAFE)
// =======================
document.getElementById("startAR").addEventListener("click", () => {
  startAR();
});

function startAR() {
  mindarThree = new window.MINDAR.IMAGE.MindARThree({
    container: document.body,
    imageTargetSrc: "./targets.mind",
  });

  const { scene, camera, renderer: r } = mindarThree;
  renderer = r;

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  const loader = new THREE.GLTFLoader();
  loader.load("./model/product.glb", (gltf) => {
    const anchor = mindarThree.addAnchor(0);
    anchor.group.add(gltf.scene);
  });

  mindarThree.start();

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

// =======================
// REC BUTTON
// =======================
document.getElementById("rec").onclick = () => {
  if (!renderer) {
    alert("Start AR first");
    return;
  }

  const stream = renderer.domElement.captureStream(30);
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm"
  });

  chunks = [];
  mediaRecorder.ondataavailable = e => chunks.push(e.data);

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ar-record.webm";
    a.click();
  };

  mediaRecorder.start();
};

// =======================
// STOP BUTTON
// =======================
document.getElementById("stop").onclick = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
};