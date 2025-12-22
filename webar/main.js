document.addEventListener("DOMContentLoaded", () => {

  // =======================
  // GLOBAL
  // =======================
  let mindarThree;
  let renderer;
  let mediaRecorder;
  let chunks = [];

  // =======================
  // START BUTTON
  // =======================
  document.getElementById("startAR").addEventListener("click", () => {
    startAR();
  });

  function startAR() {
    console.log("START AR");

    mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.body,
      imageTargetSrc: "./targets.mind",
    });

    const { scene, camera, renderer: r } = mindarThree;
    renderer = r;

    scene.add(new THREE.AxesHelper(0.5));

    mindarThree.start()
      .then(() => {
        console.log("CAMERA STARTED");
      })
      .catch(err => {
        alert("MindAR error: " + err);
      });

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }

  // =======================
  // REC
  // =======================
  document.getElementById("rec").onclick = () => {
    if (!renderer) {
      alert("Start AR first");
      return;
    }

    const stream = renderer.domElement.captureStream(30);
    mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

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
  // STOP
  // =======================
  document.getElementById("stop").onclick = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  };

});