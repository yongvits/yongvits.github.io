let mindarThree;
let renderer;
let mediaRecorder;
let chunks = [];

document.getElementById("startAR").addEventListener("click", () => {
  // ✅ ต้องอยู่ใน user gesture ตรง ๆ
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

  mindarThree.start(); // ← iOS เปิดกล้องตรงนี้

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}