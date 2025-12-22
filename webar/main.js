document.addEventListener("DOMContentLoaded", () => {

  console.log("DOM READY");

  let mindarThree = null;
  let renderer = null;
  let mediaRecorder = null;
  let chunks = [];

  // =======================
  // START AR
  // =======================
  document.getElementById("startAR").addEventListener("click", () => {
    console.log("START AR CLICK");
    startAR();
  });

  function startAR() {
    console.log("START AR FUNCTION");

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
        console.error(err);
      });

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }

  // =======================
  // REC
  // =======================
  document.getElementById("rec").addEventListener("click", () => {
    if (!renderer) {
      alert("Start AR first");
      return;
    }

    console.log("REC START");

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
  });

  // =======================
  // STOP
  // =======================
  document.getElementById("stop").addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      console.log("REC STOP");
      mediaRecorder.stop();
    }
  });

});