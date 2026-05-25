import * as THREE from 'three';
import './styles.css';

// --- ตัวแปรหลัก ---
        let scene, camera, renderer;
        
        const maxCountPerGroup = 40000;
        let currentDrawCount = 20000; 
        
        let particles1, particles2;
        let pos1, vel1, home1, phase1;
        let pos2, vel2, home2, phase2;

        let movingLights = []; 
        let roomMesh;
        let floorGrid;
        
        // Settings
        let radiusMultiplier = 1.0;
        let envTexture = null;
        let currentRoomBrightness = 1.0;
        let isAutoRotate = true; // เปิดหมุนอัตโนมัติตั้งแต่เริ่ม
        let sceneRotationAngle = 0;

        // --- Color Setup (เริ่มต้นด้วยสีทองเพื่อความหรูหรา) ---
        let currentColor1 = new THREE.Color(0xffcc00);
        let targetColor1 = new THREE.Color(0xffcc00);
        let currentColor2 = new THREE.Color(0xffffaa);
        let targetColor2 = new THREE.Color(0xffffaa);
        let currentLightColor = new THREE.Color(0xffaa00);
        let targetLightColor = new THREE.Color(0xffaa00);
        
        let currentSpeedMult = 1.0;
        let targetSpeedMult = 1.0;
        let currentTurb = 0.01;
        let targetTurb = 0.01;

        const colorPresets = {
            gold:   { c1: 0xffcc00, c2: 0xffffaa, l: 0xffaa00, turb: 0.01, speed: 1.0 },
            cyan:   { c1: 0x00ffff, c2: 0x00aaff, l: 0x00ffff, turb: 0.01, speed: 1.0 },
            fire:   { c1: 0xff4400, c2: 0xffaa00, l: 0xff2200, turb: 0.03, speed: 1.5 },
            cyber:  { c1: 0xff00ff, c2: 0x00ffff, l: 0xaa00ff, turb: 0.02, speed: 1.2 },
            nature: { c1: 0x00ff44, c2: 0xaaff00, l: 0x00ff22, turb: 0.01, speed: 0.8 }
        };

        // --- Audio Variables ---
        let audioCtx, analyser, dataArray;
        let currentAudioSource = null;
        let smoothedBass = 0.0;
        let smoothedLowMid = 0.0;
        let smoothedMid = 0.0;
        let smoothedHigh = 0.0;
        let smoothedVolume = 0.0;
        let isMicActive = false;
        
        let simTime = 0; 

        // Room Dimensions
        const roomWidth = 40;
        const roomHeight = 25;
        const roomDepth = 40;
        const bounds = { x: roomWidth / 2 - 0.5, y: roomHeight / 2 - 0.5, z: roomDepth / 2 - 0.5 };

        let targetCameraPos = new THREE.Vector3(0, 0, roomDepth / 2 - 2);
        const cameraZBase = roomDepth / 2 - 2;
        let mouseX = 0, mouseY = 0;
        let windowHalfX = window.innerWidth / 2;
        let windowHalfY = window.innerHeight / 2;
        let useGyro = false;

        let lastTime = performance.now();
        let frames = 0;
        const fpsElement = document.getElementById('fps');
        const gyroStatusElement = document.getElementById('gyro-status');
        const aiStatus = document.getElementById('ai-status');

        const ptSlider = document.getElementById('pt-slider');
        const ptSliderVal = document.getElementById('pt-slider-val');
        const radSlider = document.getElementById('rad-slider');
        const radSliderVal = document.getElementById('rad-slider-val');
        const ptDisplayVal = document.getElementById('pt-display-val');
        const colorModeSelect = document.getElementById('color-mode');
        const roomModeSelect = document.getElementById('room-mode');

        const hdriControls = document.getElementById('hdri-controls');
        const brightSlider = document.getElementById('bright-slider');
        const brightSliderVal = document.getElementById('bright-slider-val');
        const hdriPresetSelect = document.getElementById('hdri-preset');
        const hdriBtn = document.getElementById('hdri-btn');
        const hdriUpload = document.getElementById('hdri-upload');

        init();
        animate();

        // ฟังก์ชัน Texture หรูหรา (เหมือนแก้ว/เพชรเปล่งแสง)
        function createParticleTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 64; 
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.1, 'rgba(255,255,255,0.8)');
            gradient.addColorStop(0.4, 'rgba(150,200,255,0.3)'); // เรืองแสงขอบ
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
            
            const tex = new THREE.Texture(canvas);
            tex.needsUpdate = true;
            return tex;
        }

        function createDefaultHDRI() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 512);
            gradient.addColorStop(0, '#001122');
            gradient.addColorStop(0.5, '#004488');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1024, 512);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            for(let i=0; i<300; i++) {
                ctx.beginPath();
                ctx.arc(Math.random()*1024, Math.random()*512, Math.random()*1.5, 0, Math.PI*2);
                ctx.fill();
            }
            const tex = new THREE.Texture(canvas);
            tex.needsUpdate = true;
            tex.mapping = THREE.EquirectangularReflectionMapping;
            return tex;
        }

        function loadHDRI(url) {
            const loader = new THREE.TextureLoader();
            aiStatus.innerText = "กำลังโหลด HDRI...";
            loader.load(url, (tex) => {
                tex.mapping = THREE.EquirectangularReflectionMapping;
                envTexture = tex; 
                
                if(roomModeSelect.value === 'sphere-hdri' && roomMesh && roomMesh.material) {
                    roomMesh.material.map = envTexture;
                    roomMesh.material.needsUpdate = true;
                }
                aiStatus.innerText = "โหลด HDRI สำเร็จ!";
            }, undefined, function (err) {
                console.error('HDRI Load Error:', err);
                aiStatus.innerText = "ไม่พบไฟล์ " + url + " ในโฟลเดอร์";
            });
        }

        function setRoomStyle(style) {
            if(roomMesh) scene.remove(roomMesh);
            if(floorGrid) scene.remove(floorGrid);
            
            if(!envTexture) envTexture = createDefaultHDRI();

            let geo, mat;
            if(style === 'dark-box') {
                geo = new THREE.BoxGeometry(roomWidth, roomHeight, roomDepth);
                mat = new THREE.MeshStandardMaterial({color: 0x222222, side: THREE.BackSide, roughness: 0.3, metalness: 0.7});
                scene.fog.color.setHex(0x1a1a1a);
                scene.fog.density = 0.015;
                renderer.setClearColor(0x1a1a1a);
                floorGrid = new THREE.GridHelper(roomWidth, 20, 0x00ffff, 0x444444);
                floorGrid.material.opacity = 0.5;
            } else if (style === 'white-grid') {
                geo = new THREE.BoxGeometry(roomWidth, roomHeight, roomDepth);
                mat = new THREE.MeshStandardMaterial({color: 0xffffff, side: THREE.BackSide, roughness: 0.9, metalness: 0.1});
                scene.fog.color.setHex(0xcccccc);
                scene.fog.density = 0.01;
                renderer.setClearColor(0xcccccc);
                floorGrid = new THREE.GridHelper(roomWidth, 20, 0x888888, 0xbbbbbb);
                floorGrid.material.opacity = 0.8;
            } else if (style === 'cylinder') {
                geo = new THREE.CylinderGeometry(roomWidth/1.5, roomWidth/1.5, roomHeight, 32);
                mat = new THREE.MeshStandardMaterial({color: 0x151515, side: THREE.BackSide, roughness: 0.2, metalness: 0.8});
                scene.fog.color.setHex(0x0a0a0a);
                scene.fog.density = 0.02;
                renderer.setClearColor(0x0a0a0a);
                floorGrid = new THREE.PolarGridHelper(roomWidth/1.5, 16, 8, 64, 0x00ffff, 0x333333);
                floorGrid.material.opacity = 0.4;
            } else if (style === 'sphere-hdri') {
                geo = new THREE.SphereGeometry(roomWidth * 1.5, 64, 40);
                geo.scale(-1, 1, 1); 
                mat = new THREE.MeshBasicMaterial({ 
                    map: envTexture,
                    color: new THREE.Color().setScalar(currentRoomBrightness)
                });
                scene.fog.color.setHex(0x000000);
                scene.fog.density = 0.005;
                renderer.setClearColor(0x000000);
                floorGrid = null;
            }
            
            roomMesh = new THREE.Mesh(geo, mat);
            scene.add(roomMesh);
            
            if(floorGrid) {
                floorGrid.position.y = -roomHeight / 2 + 0.1;
                floorGrid.material.transparent = true;
                scene.add(floorGrid);
            }
        }

        function init() {
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x1a1a1a, 0.015); 

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(0, 0, cameraZBase);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); 
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(renderer.domElement);

            setRoomStyle('dark-box');

            const ambientLight = new THREE.AmbientLight(0x666666); 
            scene.add(ambientLight);

            const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8); 
            scene.add(hemiLight);

            for (let i = 0; i < 3; i++) {
                let pLight = new THREE.PointLight(0xffaa00, 1.5, 30); 
                scene.add(pLight);
                movingLights.push({
                    light: pLight,
                    offset: Math.random() * Math.PI * 2,
                    speed: Math.random() * 0.3 + 0.3
                });
            }

            createOptimizedParticles();
            updateDrawRange(); 

            window.addEventListener('resize', onWindowResize, false);
            document.addEventListener('mousemove', onDocumentMouseMove, false);
            
            ptSlider.addEventListener('input', (e) => {
                ptSliderVal.innerText = parseInt(e.target.value).toLocaleString();
                updateDrawRange();
            });

            radSlider.addEventListener('input', (e) => {
                radSliderVal.innerText = e.target.value + '%';
                radiusMultiplier = parseInt(e.target.value) / 100;
            });

            colorModeSelect.addEventListener('change', (e) => {
                const preset = colorPresets[e.target.value];
                if(preset) {
                    targetColor1.setHex(preset.c1);
                    targetColor2.setHex(preset.c2);
                    targetLightColor.setHex(preset.l);
                    targetTurb = preset.turb;
                    targetSpeedMult = preset.speed;
                    aiStatus.innerText = `โหมดสี: ${e.target.options[e.target.selectedIndex].text}`;
                }
            });

            roomModeSelect.addEventListener('change', (e) => {
                setRoomStyle(e.target.value);
                if(e.target.value === 'sphere-hdri') {
                    hdriControls.style.display = 'block';
                } else {
                    hdriControls.style.display = 'none';
                }
            });

            brightSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                brightSliderVal.innerText = val + '%';
                currentRoomBrightness = val / 100;
                
                if(roomModeSelect.value === 'sphere-hdri' && roomMesh && roomMesh.material) {
                    roomMesh.material.color.setScalar(currentRoomBrightness);
                }
            });

            hdriPresetSelect.addEventListener('change', (e) => {
                if(e.target.value === 'default') {
                    envTexture = createDefaultHDRI();
                    if(roomModeSelect.value === 'sphere-hdri' && roomMesh && roomMesh.material) {
                        roomMesh.material.map = envTexture;
                        roomMesh.material.needsUpdate = true;
                    }
                    aiStatus.innerText = "ใช้ภาพอวกาศจำลอง (Default)";
                } else {
                    loadHDRI('/hdri/' + e.target.value);
                }
            });

            hdriBtn.addEventListener('click', () => { hdriUpload.click(); });
            
            hdriUpload.addEventListener('change', function(e) {
                if (this.files && this.files[0]) {
                    const file = this.files[0];
                    const url = URL.createObjectURL(file);
                    loadHDRI(url);
                }
            });
            
            const toggleUiBtn = document.getElementById('toggle-ui-btn');
            toggleUiBtn.addEventListener('click', () => {
                document.body.classList.toggle('ui-hidden');
                if (document.body.classList.contains('ui-hidden')) {
                    toggleUiBtn.innerText = "👁️ แสดง UI";
                } else {
                    toggleUiBtn.innerText = "👁️ ซ่อน UI";
                }
            });

            const toggleRotateBtn = document.getElementById('toggle-rotate-btn');
            toggleRotateBtn.addEventListener('click', () => {
                isAutoRotate = !isAutoRotate;
                if(isAutoRotate) {
                    toggleRotateBtn.innerText = "🔄 ปิดหมุนฉาก";
                    toggleRotateBtn.classList.add('active');
                } else {
                    toggleRotateBtn.innerText = "🔄 เปิดหมุนฉาก";
                    toggleRotateBtn.classList.remove('active');
                }
            });

            document.getElementById('start-btn').addEventListener('click', () => {
                initDeviceOrientation();
                initAudioContext();
                const overlay = document.getElementById('start-overlay');
                overlay.style.opacity = '0';
                setTimeout(() => { overlay.style.display = 'none'; }, 500);
            });

            document.getElementById('ai-btn').addEventListener('click', generateRandomAura);

            const audioUpload = document.getElementById('audio-upload');
            const fileBtn = document.getElementById('file-btn');
            const micBtn = document.getElementById('mic-btn');
            const audioPlayer = document.getElementById('audio-player');

            fileBtn.addEventListener('click', () => { audioUpload.click(); });
            
            audioUpload.addEventListener('change', function(e) {
                if (this.files && this.files[0]) {
                    const file = this.files[0];
                    const url = URL.createObjectURL(file);
                    audioPlayer.src = url;
                    audioPlayer.style.display = "block"; 
                    audioPlayer.play();
                    setupAudioSource(audioPlayer, false);
                    
                    micBtn.classList.remove('active');
                    fileBtn.classList.add('active');
                    isMicActive = false;
                    aiStatus.innerText = "กำลังเล่นเพลง: " + file.name;
                }
            });

            micBtn.addEventListener('click', async () => {
                if (!isMicActive) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        setupAudioSource(stream, true);
                        micBtn.classList.add('active');
                        fileBtn.classList.remove('active');
                        audioPlayer.pause();
                        audioPlayer.style.display = "none"; 
                        isMicActive = true;
                        aiStatus.innerText = "กำลังรับเสียงจากไมโครโฟน";
                    } catch (err) {
                        console.error("Mic access denied:", err);
                        alert("ไม่สามารถเข้าถึงไมโครโฟนได้ โปรดอนุญาตสิทธิ์ก่อน");
                    }
                }
            });
        }

        function updateDrawRange() {
            const totalDesired = parseInt(ptSlider.value);
            currentDrawCount = Math.floor(totalDesired / 2); 
            particles1.geometry.setDrawRange(0, currentDrawCount);
            particles2.geometry.setDrawRange(0, currentDrawCount);
            ptDisplayVal.innerText = Math.round(totalDesired / 1000) + 'k';
        }

        function initAudioContext() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256; 
                dataArray = new Uint8Array(analyser.frequencyBinCount);
            }
            if(audioCtx.state === 'suspended') { audioCtx.resume(); }
        }

        function setupAudioSource(sourceNode, isMic) {
            initAudioContext();
            if (currentAudioSource) currentAudioSource.disconnect();
            if (isMic) {
                currentAudioSource = audioCtx.createMediaStreamSource(sourceNode);
                currentAudioSource.connect(analyser);
            } else {
                if (!sourceNode._threeAudioSource) {
                    sourceNode._threeAudioSource = audioCtx.createMediaElementSource(sourceNode);
                }
                currentAudioSource = sourceNode._threeAudioSource;
                currentAudioSource.connect(analyser);
                analyser.connect(audioCtx.destination);
            }
        }

        // สร้างรูปทรงด้วยสมการ Fibonacci Sphere ทำให้แกนกลางหนาแน่นหรูหรา
        function createOptimizedParticles() {
            const tex = createParticleTexture(); 

            function allocateGroup(count) {
                const pos = new Float32Array(count * 3);
                const vel = new Float32Array(count * 3);
                const home = new Float32Array(count * 3);
                const phase = new Float32Array(count * 2);

                const goldenAngle = Math.PI * (3 - Math.sqrt(5));

                for (let i = 0; i < count; i++) {
                    // การกระจายแบบ Fibonacci
                    let y = 1 - (i / (count - 1)) * 2;
                    let radiusAtY = Math.sqrt(1 - y * y);
                    let theta = goldenAngle * i;
                    
                    let x = Math.cos(theta) * radiusAtY;
                    let z = Math.sin(theta) * radiusAtY;

                    // ทำให้มีชั้นแกนกลางหนาแน่น (Core) และฟุ้งด้านนอก (Aura)
                    let layer = Math.random();
                    let radius = 1.0 + (Math.pow(layer, 3) * 4.0); 

                    x *= radius; y *= radius; z *= radius;

                    pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
                    home[i*3] = x; home[i*3+1] = y; home[i*3+2] = z;
                    
                    vel[i*3] = (Math.random() - 0.5) * 0.05;
                    vel[i*3+1] = (Math.random() - 0.5) * 0.05;
                    vel[i*3+2] = (Math.random() - 0.5) * 0.05;

                    const p = Math.random() * Math.PI * 2;
                    phase[i*2] = Math.sin(p);
                    phase[i*2+1] = Math.cos(p);
                }
                return { pos, vel, home, phase };
            }

            const g1 = allocateGroup(maxCountPerGroup);
            pos1 = g1.pos; vel1 = g1.vel; home1 = g1.home; phase1 = g1.phase;
            
            const g2 = allocateGroup(maxCountPerGroup);
            pos2 = g2.pos; vel2 = g2.vel; home2 = g2.home; phase2 = g2.phase;

            const geo1 = new THREE.BufferGeometry();
            geo1.setAttribute('position', new THREE.BufferAttribute(pos1, 3));
            
            const geo2 = new THREE.BufferGeometry();
            geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));

            const mat1 = new THREE.PointsMaterial({
                color: currentColor1, 
                size: 0.35, 
                map: tex,
                blending: THREE.AdditiveBlending, 
                transparent: true, 
                opacity: 0.8, 
                depthWrite: false
            });
            const mat2 = new THREE.PointsMaterial({
                color: currentColor2, 
                size: 0.35, 
                map: tex,
                blending: THREE.AdditiveBlending, 
                transparent: true, 
                opacity: 0.8, 
                depthWrite: false
            });

            particles1 = new THREE.Points(geo1, mat1);
            particles2 = new THREE.Points(geo2, mat2);
            
            scene.add(particles1);
            scene.add(particles2);
        }

        function initDeviceOrientation() {
            try {
                if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                    DeviceOrientationEvent.requestPermission()
                        .then(permissionState => {
                            if (permissionState === 'granted') {
                                window.addEventListener('deviceorientation', handleOrientation);
                                useGyro = true;
                                gyroStatusElement.innerText = "Gyro-Parallax: Active";
                            } else { gyroStatusElement.innerText = "Gyro-Parallax: Denied"; }
                        }).catch(console.error);
                } else {
                    window.addEventListener('deviceorientation', handleOrientation);
                    useGyro = true;
                    gyroStatusElement.innerText = "Gyro-Parallax: Active";
                }
            } catch(e) {
                console.error("Gyro Error:", e);
                gyroStatusElement.innerText = "Gyro-Parallax: Error";
            }
        }

        function handleOrientation(event) {
            if (!event.gamma || !event.beta) return;
            
            let orientation = (screen.orientation || {}).angle || window.orientation || 0;
            let gamma = event.gamma;
            let beta = event.beta;
            let x, y;
            
            if (orientation === 90) {
                x = beta;
                y = -gamma - 45;
            } else if (orientation === -90 || orientation === 270) {
                x = -beta;
                y = gamma - 45;
            } else {
                x = gamma;
                y = beta - 45;
            }

            x = Math.max(-45, Math.min(45, x));
            y = Math.max(-45, Math.min(45, y));
            targetCameraPos.x = (x / 45) * 8;
            targetCameraPos.y = -(y / 45) * 5;
        }

        function onDocumentMouseMove(event) {
            if (useGyro) return;
            mouseX = (event.clientX - windowHalfX);
            mouseY = (event.clientY - windowHalfY);
            targetCameraPos.x = (mouseX / windowHalfX) * 8;
            targetCameraPos.y = -(mouseY / windowHalfY) * 5;
        }

        function onWindowResize() {
            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function updatePhysicsGroup(activeCount, pos, vel, home, phase, sin_t1, cos_t1, sin_t2, cos_t2, curTurb, pull, maxV, maxVSq, sBass, sLowMid, sMid, gyroShiftX, gyroShiftY) {
            for(let i=0; i<activeCount; i++) {
                let i3 = i*3, i2 = i*2;
                
                let px = pos[i3], py = pos[i3+1], pz = pos[i3+2];
                let hx = home[i3] * radiusMultiplier;
                let hy = home[i3+1] * radiusMultiplier;
                let hz = home[i3+2] * radiusMultiplier;

                let vx = vel[i3], vy = vel[i3+1], vz = vel[i3+2];
                
                let sin_p = phase[i2];
                let cos_p = phase[i2+1];

                // หา Vector ทิศทางที่ชี้ออกจากศูนย์กลาง (เพื่อให้หนามแทงออกไปด้านนอก)
                let len = Math.sqrt(hx*hx + hy*hy + hz*hz);
                if(len === 0) len = 0.001;
                let nx = hx/len, ny = hy/len, nz = hz/len;

                // สร้างรูปทรงหนามแหลมคมหรูหรา โดยใช้ Noise แบบ Radial
                let spikeShape = Math.sin(nx * 4.5 + sin_t1) * Math.cos(ny * 4.5 + cos_t1) * Math.sin(nz * 4.5 + sin_t2);
                let spikeForce = Math.pow(Math.abs(spikeShape), 3) * (sBass * 30.0); // ใช้ Math.pow เพื่อให้ปลายแหลม

                // การหายใจเข้าออกของก้อนรวม
                let breathe = 1.0 + (sLowMid * 0.3);

                // ผลักอนุภาคออกไปตามแนวรัศมี + แรงโน้มถ่วงจาก Gyro
                let targetX = (hx * breathe) + (nx * spikeForce) + gyroShiftX;
                let targetY = (hy * breathe) + (ny * spikeForce) + gyroShiftY;
                let targetZ = (hz * breathe) + (nz * spikeForce);

                // คลื่นปั่นป่วนบนผิว
                let rippleStr = curTurb + (sMid * 0.1);
                let moveX = (sin_t1 * cos_p + cos_t1 * sin_p) * rippleStr;
                let moveY = (cos_t1 * cos_p - sin_t1 * sin_p) * rippleStr;
                let moveZ = (sin_t2 * cos_p + cos_t2 * sin_p) * rippleStr;

                vx += moveX + (targetX - px) * pull;
                vy += moveY + (targetY - py) * pull;
                vz += moveZ + (targetZ - pz) * pull;

                let vSq = vx*vx + vy*vy + vz*vz;
                if(vSq > maxVSq) {
                    let f = maxV / Math.sqrt(vSq);
                    vx *= f; vy *= f; vz *= f;
                }

                px += vx; py += vy; pz += vz;

                // การชนกำแพง
                if (px > bounds.x) { px = bounds.x; vx *= -0.6; }
                else if (px < -bounds.x) { px = -bounds.x; vx *= -0.6; }
                if (py > bounds.y) { py = bounds.y; vy *= -0.6; }
                else if (py < -bounds.y) { py = -bounds.y; vy *= -0.6; }
                if (pz > bounds.z) { pz = bounds.z; vz *= -0.6; }
                else if (pz < -bounds.z) { pz = -bounds.z; vz *= -0.6; }

                pos[i3] = px; pos[i3+1] = py; pos[i3+2] = pz;
                vel[i3] = vx; vel[i3+1] = vy; vel[i3+2] = vz;
            }
        }

        function updatePhysics() {
            let bSum = 0, lmSum = 0, mSum = 0, hSum = 0;
            let currentVolume = 0;
            
            if (analyser && dataArray) {
                analyser.getByteFrequencyData(dataArray);
                
                for(let i=0; i<=5; i++) bSum += dataArray[i];
                for(let i=6; i<=15; i++) lmSum += dataArray[i];
                for(let i=16; i<=45; i++) mSum += dataArray[i];
                for(let i=46; i<=100; i++) hSum += dataArray[i];

                let bAvg = (bSum / 6) / 255.0;
                let lmAvg = (lmSum / 10) / 255.0;
                let mAvg = (mSum / 30) / 255.0;
                let hAvg = (hSum / 55) / 255.0;
                
                smoothedBass += (bAvg - smoothedBass) * 0.2;
                smoothedLowMid += (lmAvg - smoothedLowMid) * 0.15;
                smoothedMid += (mAvg - smoothedMid) * 0.15;
                smoothedHigh += (hAvg - smoothedHigh) * 0.2;

                let volSum = 0;
                for(let i = 0; i < analyser.frequencyBinCount; i++) volSum += dataArray[i];
                currentVolume = (volSum / analyser.frequencyBinCount) / 255.0;
            }
            
            smoothedVolume += (currentVolume - smoothedVolume) * 0.15;

            const idleRatio = 0.1;
            const timeSpeed = (idleRatio * 0.5) + (smoothedVolume * 3.0);
            simTime += 0.02 * timeSpeed * currentSpeedMult;

            currentColor1.lerp(targetColor1, 0.02);
            currentColor2.lerp(targetColor2, 0.02);
            currentLightColor.lerp(targetLightColor, 0.02);
            currentSpeedMult += (targetSpeedMult - currentSpeedMult) * 0.02;
            currentTurb += (targetTurb - currentTurb) * 0.02;

            particles1.material.color.copy(currentColor1);
            particles2.material.color.copy(currentColor2);
            
            if(floorGrid) {
                let gridColor = currentLightColor.clone();
                if(roomModeSelect.value === 'white-grid') {
                    gridColor.multiplyScalar(0.4);
                } else {
                    gridColor.multiplyScalar(0.7);
                }
                floorGrid.material.color.copy(gridColor); 
            }

            const realTime = performance.now() * 0.001; 
            movingLights.forEach(ml => {
                ml.light.color.copy(currentLightColor);
                ml.light.position.x = Math.sin(realTime * ml.speed + ml.offset) * (bounds.x * 0.9);
                ml.light.position.y = Math.cos(realTime * (ml.speed * 0.8) + ml.offset) * (bounds.y * 0.9);
                ml.light.position.z = Math.sin(realTime * (ml.speed * 1.2) + ml.offset) * (bounds.z * 0.9);
                ml.light.intensity = 1.0 + (smoothedHigh * 5.0);
            });

            const t1 = simTime;
            const t2 = simTime * 0.5;
            const sin_t1 = Math.sin(t1), cos_t1 = Math.cos(t1);
            const sin_t2 = Math.sin(t2), cos_t2 = Math.cos(t2);
            
            let gyroShiftX = targetCameraPos.x * 2.2;
            let gyroShiftY = targetCameraPos.y * 2.2;

            const pull = 0.005 * currentSpeedMult + (smoothedBass * 0.02);
            let activeSpeedLimit = (idleRatio * 0.2) + (smoothedVolume * 0.8);
            if(activeSpeedLimit < 0.01) activeSpeedLimit = 0.01;

            const maxV = activeSpeedLimit * currentSpeedMult;
            const maxVSq = maxV * maxV;

            updatePhysicsGroup(currentDrawCount, pos1, vel1, home1, phase1, sin_t1, cos_t1, sin_t2, cos_t2, currentTurb, pull, maxV, maxVSq, smoothedBass, smoothedLowMid, smoothedMid, gyroShiftX, gyroShiftY);
            updatePhysicsGroup(currentDrawCount, pos2, vel2, home2, phase2, sin_t1, cos_t1, sin_t2, cos_t2, currentTurb, pull, maxV, maxVSq, smoothedBass, smoothedLowMid, smoothedMid, gyroShiftX, gyroShiftY);

            particles1.geometry.attributes.position.needsUpdate = true;
            particles2.geometry.attributes.position.needsUpdate = true;
            
            // หมุนก้อนตามเสียง
            particles1.rotation.y = simTime * (0.1 + smoothedMid * 0.2);
            particles1.rotation.z = simTime * (0.05 + smoothedMid * 0.1);
            particles2.rotation.y = simTime * (0.1 + smoothedMid * 0.2);
            particles2.rotation.z = simTime * (0.05 + smoothedMid * 0.1);

            // --- ระบบหมุนฉาก 360 องศา (Auto-Rotate) ---
            if(isAutoRotate) {
                sceneRotationAngle += 0.001; // หมุนนิ่มๆ
                scene.rotation.y = sceneRotationAngle;
            }
        }

        function generateRandomAura() {
            const btn = document.getElementById('ai-btn');
            
            btn.disabled = true;
            btn.innerText = "กำลังจูน...";
            aiStatus.innerText = "กำลังดึงพลังงาน...";
            colorModeSelect.value = ""; 

            setTimeout(() => {
                targetColor1.setHSL(Math.random(), 0.8 + Math.random()*0.2, 0.4 + Math.random()*0.3);
                targetColor2.setHSL(Math.random(), 0.8 + Math.random()*0.2, 0.4 + Math.random()*0.3);
                targetLightColor.setHSL(Math.random(), 0.8 + Math.random()*0.2, 0.5 + Math.random()*0.3);
                
                targetSpeedMult = 0.5 + Math.random() * 2.0;
                targetTurb = 0.01 + Math.random() * 0.04;
                
                const texts = ["พายุแห่งสีสัน", "ความสงบในอวกาศ", "เปลวเพลิงเริงระบำ", "คลื่นแห่งอนาคต", "พลังงานลี้ลับ", "แสงสะท้อนแห่งจิตวิญญาณ", "มิติควอนตัม", "ทะเลดาวประกาย"];
                aiStatus.innerText = texts[Math.floor(Math.random() * texts.length)];
                
                btn.disabled = false;
                btn.innerText = "🎲 สุ่มบรรยากาศ (Random)";
            }, 300);
        }

        function animate() {
            requestAnimationFrame(animate);
            // กล้องขยับตาม Gyroscope หรือเมาส์
            camera.position.x += (targetCameraPos.x - camera.position.x) * 0.05;
            camera.position.y += (targetCameraPos.y - camera.position.y) * 0.05;
            // ให้กล้องมองไปที่กึ่งกลางตลอด
            camera.lookAt(0, 0, 0); 

            updatePhysics();
            renderer.render(scene, camera);

            frames++;
            const time = performance.now();
            if (time >= lastTime + 1000) {
                fpsElement.innerText = Math.round((frames * 1000) / (time - lastTime));
                frames = 0;
                lastTime = time;
            }
        }