var korkeus = 920;
var leveys = 540;
var player;
var spaceBar;
var buttonPressed;
var raapimispuuGroup;
var pisteGroup;
var ground;
var puuTimer;
var meow;
var meowAlku;
var meowHyppy;

var peliKaynnissa = false;
var pelaaNappain;
var uudestaanNappain;

const puidenLiike = -200;
const painovoima = 2000;
const hyppy = -600;
const puuTimerDelay = 1600;

class mainScene {


	preload() {
		this.load.image('tausta', 'assets/blueBackground.png');
		this.load.image('kissa', 'assets/zorro.png');
		this.load.image('raapimisAla', 'assets/raapimisAla.png');
		this.load.image('raapimisYla', 'assets/raapimisYla.png');
		this.load.image('maa', 'assets/ground.png');
		this.load.image('laskija', 'assets/laskija.png');
		this.load.image('pelaaNappain', 'assets/playbutton.png');
		this.load.image('uudestaanNappain', 'assets/resetbutton.png')
		this.load.audio('meow', 'assets/zorro.3.wav');
		this.load.audio('meowAlkaa', 'assets/zorro.1.wav');
		this.load.audio('catTrill', 'assets/catTrill.wav');
	}


	create() {
		//luo taustakuva
		this.add.image(leveys / 2, korkeus / 2, 'tausta');

		//luo äänet
		meow = this.sound.add('meow', { loop: false, volume: 0.5 });
		meowAlku = this.sound.add('meowAlkaa', { loop: false, volume: 0.5 });
		meowHyppy = this.sound.add('catTrill', { loop: false, volume: 0.2 });
		
		//luo maa, näppäin, putkigroup, kerättävät pisteet -group
		ground = this.physics.add.staticGroup();
		spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
		raapimispuuGroup = this.add.group();
		pisteGroup = this.add.group();

		//label pisteitä varten
		this.score = 0;
		this.labelScore = this.add.text(leveys / 2 - 20, 50, "0", {
			font: "70px Arial",
			fill: "#000000"
		});
		this.labelScore.setDepth(1); //Asetetaan teksti kaiken päälle

		//luo pelaaja
		player = this.physics.add.sprite(leveys / 3, korkeus / 2, 'kissa').setScale(0.35); //rivien vaihtelu raporttiin

		//luo maa ja katto
		ground.create(leveys / 2, korkeus - 10, 'maa');
		ground.create(leveys / 2, -100, 'maa');

		//collision ja overlap. Overlap pisteiden keräämiseen
		this.physics.add.collider(player, ground);
		this.physics.add.collider(player, raapimispuuGroup);
		this.physics.add.overlap(player, pisteGroup)
		player.body.onCollide = true;
		player.body.onOverlap = true;

		//törmäyksen tapahtuessa peli loppuu. Pelaaja käännetään katsomaan maata 
		this.physics.world.on('collide', (gameObject1, gameObject2, body1, body2) => {
			gameObject1.angle = 75;
			this.peliOhi();
		})

		//Overlaptarkastus. Putkien välissä on näkymätön objekti, jota koskiessa tämä tapahtuu.
		this.physics.world.on('overlap', (gameObject1, gameObject2, body1, body2) => {
			this.pisteenKerays(gameObject1, gameObject2);
		});

		//raapimispuiden(=putkien) luominen timerillä. Callbackissa kutsutaan aliohjelmaa.
		puuTimer = this.time.addEvent({
			delay: puuTimerDelay,
			callback: this.lisaaPuut,
			callbackScope: this,
			loop: true,
		});

		//luo pelaa-näppäin
		pelaaNappain = this.add.sprite(leveys / 2, korkeus / 2, 'pelaaNappain');
		pelaaNappain.setInteractive();
		pelaaNappain.depth = 1;
		pelaaNappain.on('pointerdown', this.aloitaPeli);

		//reset näppäin. Resettaa scenen, jonka jälkeen luo pelaa-näppäimen.
		uudestaanNappain = this.add.sprite(leveys / 2, korkeus / 2, 'uudestaanNappain');
		uudestaanNappain.setInteractive();
		uudestaanNappain.depth = 1;
		uudestaanNappain.on('pointerdown', () => {
			this.score = 0;
			this.scene.restart();
		});
		uudestaanNappain.setVisible(false);
	}


	update(time, delta) {
		//ajastin pauselle, jos peli ei ole käynnissä
		if (!peliKaynnissa) {
			puuTimer.paused = true;
		}
		//ajastin päälle ja pelaajan control aktiiviseksi, jos peli on käynnissä.
		if (peliKaynnissa) {
			this.playerHyppy(delta);
			puuTimer.paused = false;
		}
		//pelaajan kulmaa muutetaan sen y-velocityn perusteella
		if (player.body.velocity.y < 0) {
			player.angle = -20;
		}
		if (player.body.velocity.y > 0) {
			player.angle = 10;
		}
	}


	/**
	 * Luo alemman raapimispuun.
	 * 
	 * @param {number} x Mihin x-koordinaattiin se luodaan
	 * @param {number} vali Mihin y-koordinaattiin se luodaan. Y-koordinaatti määräytyy tällä + vakiolla.
	 */
	lisaaAlaPuu(x, vali) {
		var alaPuu = this.physics.add.sprite(x, (970 + vali), 'raapimisAla').setScale(0.8, 1);
		raapimispuuGroup.add(alaPuu);
		alaPuu.body.pushable = false;
		alaPuu.body.velocity.x = puidenLiike;
		alaPuu.checkWorldBounds = true;
		alaPuu.outOfBoundsKill = true;
	}

	/**
	 * Luo ylemmän raapimispuun
	 * 
	 * @param {number} x Mihin x-koordinaattiin se luodaan
	 * @param {number} vali Mihin y-koordinaattiin se luodaan. Y-koordinaatti määräytyy tällä + vakiolla.
	 */
	lisaaYlaPuu(x, vali) {
		var ylaPuu = this.physics.add.sprite(x, (-50 + vali), 'raapimisYla').setScale(0.8, 1);
		raapimispuuGroup.add(ylaPuu);
		ylaPuu.body.pushable = false;
		ylaPuu.body.velocity.x = puidenLiike;
		ylaPuu.checkWorldBounds = true;
		ylaPuu.outOfBoundsKill = true;
	}

	/**
	 * Luodaan puut ja näkymätön pisteobjekti.
	 * Raapimispuiden väli määritellään satunnaisesti 500-pikselin väliselle alueelle.
	 * laskija-muuttuja on objekti, joka luodaan samaan kohtaan kuin raapimispuut. 
	 * Se on näkymätön ja eri collisiongroupissa kuin puut.
	 */
	lisaaPuut() {
		const minCeiled = Math.ceil(-250);
		const maxFloored = Math.floor(250);
		var missaVali = Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);

		this.lisaaYlaPuu(leveys + 50, missaVali);
		this.lisaaAlaPuu(leveys + 50, missaVali);

		var laskija = this.physics.add.sprite(leveys + 50, korkeus / 2, 'laskija');
		pisteGroup.add(laskija);
		laskija.body.velocity.x = puidenLiike;
		laskija.alpha = 0;
		laskija.checkWorldBounds = true;
		laskija.outOfBoundsKill = true;
	}


	/**
	 * Hypylle funktio.
	 * Jos näppäintä ei ole painettu, voidaan hypätä. Jos on, muutetaan boolean trueksi,
	 * jolloin ei voida hypätä. Boolean muutetaan takaisin falseksi, kun näppäin nostetaan 
	 * ylös.
	 */
	playerHyppy(delta) {
		if (spaceBar.isDown || this.input.activePointer.isDown) {
			if (!buttonPressed) {
				player.setVelocityY(hyppy) * delta;
				meowHyppy.play();
				buttonPressed = true;
			}
		}
		else {
			buttonPressed = false;
		}
	}


	/**
	 * Pisteidenkeruu. Kutsutaan, kun on overlap pelaajan ja "laskija" -objektin kanssa.
	 * Laskija tuhotaan ja pisteitä kasvatetaan. 
	 */
	pisteenKerays(player, piste) {
		piste.destroy();
		this.score += 1;
		this.labelScore.text = this.score;
		meow.play();
	}
 	

	/**
	 * Jos peli on ohi, tuodaan uudestaan-näppäin esille.
	 */
	peliOhi = () => {
		peliKaynnissa = false;
		uudestaanNappain.setVisible(true);
	}


	/**
	 * Pelin aloitus. 
	 * Soitetaan naukaisu, annetaan pelaajalle painovoima, poistetaan aloitusnäppäin ja käynnistetään
	 * peli.
	 */
	aloitaPeli() {
		meowAlku.play();
		player.body.gravity.y = painovoima;
		pelaaNappain.setVisible(false);
		peliKaynnissa = true;	
	}
}

const config = {
    width: leveys,
    height: korkeus,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: mainScene,
    physics: {
        default: 'arcade',
        arcade: {
        	//gravity: { y: 1500 },
        	debug: false
        }
    }
};

const game = new Phaser.Game(config);

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
//https://stackoverflow.com/questions/73127868/phaser-time-event-wont-loop
//https://labs.phaser.io/edit.html?src=src/physics\arcade\collide%20event.js