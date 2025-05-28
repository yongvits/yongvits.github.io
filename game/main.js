
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    plugins: {
        scene: [{
            key: 'rexGestures',
            plugin: rexgesturesplugin,
            mapping: 'rexGestures'
        }]
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let player;
let platforms;
let leftBtn, rightBtn, jumpBtn;
let moveLeft = false, moveRight = false, isJumping = false;

const game = new Phaser.Game(config);

function preload () {
    this.load.image('sky', 'https://labs.phaser.io/assets/skies/sky4.png');
    this.load.image('ground', 'https://labs.phaser.io/assets/platform.png');
    this.load.spritesheet('dude',
        'https://labs.phaser.io/assets/sprites/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
}

function create () {
    this.add.image(config.width / 2, config.height / 2, 'sky').setDisplaySize(config.width, config.height);

    platforms = this.physics.add.staticGroup();
    platforms.create(400, config.height - 32, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, platforms);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // Touch controls
    leftBtn = document.getElementById("left");
    rightBtn = document.getElementById("right");
    jumpBtn = document.getElementById("jump");

    leftBtn.addEventListener('touchstart', () => moveLeft = true);
    leftBtn.addEventListener('touchend', () => moveLeft = false);

    rightBtn.addEventListener('touchstart', () => moveRight = true);
    rightBtn.addEventListener('touchend', () => moveRight = false);

    jumpBtn.addEventListener('touchstart', () => isJumping = true);
    jumpBtn.addEventListener('touchend', () => isJumping = false);

    // Pinch gesture
    let pinch = this.rexGestures.add.pinch();
    pinch.on('pinch', (pinch) => {
        this.cameras.main.zoom *= pinch.scaleFactor;
    });

    // Pan gesture
    let pan = this.rexGestures.add.pan();
    pan.on('pan', (pan) => {
        this.cameras.main.scrollX -= pan.dx / this.cameras.main.zoom;
        this.cameras.main.scrollY -= pan.dy / this.cameras.main.zoom;
    });
}

function update () {
    if (moveLeft) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (moveRight) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (isJumping && player.body.touching.down) {
        player.setVelocityY(-350);
    }
}
