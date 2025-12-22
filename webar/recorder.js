let recorder;
let chunks = [];

function startRecord() {
  const canvas = document.querySelector("canvas");
  const stream = canvas.captureStream(30);

  recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  chunks = [];

  recorder.ondataavailable = e => chunks.push(e.data);

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "image-ar.webm";
    a.click();
  };

  recorder.start();
}

function stopRecord() {
  if (recorder && recorder.state === "recording") recorder.stop();
}
