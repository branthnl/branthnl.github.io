const Game = new BranthRoom('Game', 960, 540);
Room.add(Game);

const GRAVITY = 0.65;
const FRICTION = 0.5;

class Camera extends BranthBehaviour {
	shake(duration) {
		this.alarm[0] = duration;
	}
	update() {
		if (this.alarm[0] > 0) {
			const mag = this.alarm[0] / 500;
			View.x = Math.random() * mag * Math.randneg();
			View.y = Math.random() * mag * Math.randneg();
		}
		else {
			View.x = 0;
			View.y = 0;
		}
	}
}

class Player extends BranthBehaviour {
	constructor(x, y, controls, c) {
		super(x, y);
		this.keyW = controls.keyW;
		this.keyA = controls.keyA;
		this.keyS = controls.keyS;
		this.keyD = controls.keyD;
		this.w = 24;
		this.h = 24;
		this.hsp = 0;
		this.vsp = -5;
		this.mpd = 1.8;
		this.gndAcc = 0.3 * this.mpd;
		this.gndMax = 6 * this.mpd;
		this.airAcc = 0.2 * this.mpd;
		this.airFrc = 0.01;
		this.airMax = 5 * this.mpd;
		this.jmpSpd = -5 * this.mpd;
		this.jmpHold = false;
		this.onGround = true;
		this.xs = 1;
		this.ys = 1;
		this.c = c;
	}
	get mid() {
		return {
			w: this.w * 0.5,
			h: this.h * 0.5
		}
	}
	get bound() {
		return {
			l: this.x - this.mid.w,
			r: this.x + this.mid.w,
			t: this.y - this.h,
			b: this.y
		}
	}
	updateControls() {
		const key_wu = Input.keyUp(this.keyW);
		const key_wd = Input.keyDown(this.keyW);
		const key_a = Input.keyHold(this.keyA);
		const key_s = Input.keyHold(this.keyS);
		const key_d = Input.keyHold(this.keyD);

		let acc = this.gndAcc;
		let spd = this.gndMax;
		let frc = FRICTION;
		if (!this.onGround) {
			acc = this.airAcc;
			spd = this.airMax;
			frc = this.airFrc;
		}

		if (key_a) {
			this.hsp -= acc;
			if (this.hsp > 0.3) this.hsp -= frc;
		}

		if (key_d) {
			this.hsp += acc;
			if (this.hsp < -0.3) this.hsp += frc;
		}

		if ((!key_a && !key_d) || (key_a && key_d)) {
			if (Math.abs(this.hsp) > 0.3) this.hsp -= Math.sign(this.hsp) * frc;
			else this.hsp = 0;
		}

		this.hsp = Math.clamp(this.hsp, -spd, spd);

		if (key_wd) {
			this.vsp = this.jmpSpd;
			this.xs = 0.75;
			this.ys = 1.25;
			this.jmpHold = true;
			this.alarm[0] = 666;
		}

		if (key_wu) this.jmpHold = false;

		const l_wall = this.bound.l <= 32;
		const r_wall = this.bound.r >= Room.w - 32;

		if (!this.onGround && (l_wall || r_wall)) {
			if (key_wd) {
				if (l_wall) {
					if (key_a) {
						this.hsp = this.jmpSpd * -0.3;
						this.vsp = this.jmpSpd;
					}
					else {
						this.hsp = this.jmpSpd * -0.8;
						this.vsp = this.jmpSpd * 0.7;
					}
				}
				else if (r_wall) {
					if (key_d) {
						this.hsp = this.jmpSpd * 0.3;
						this.vsp = this.jmpSpd;
					}
					else {
						this.hsp = this.jmpSpd * 0.8;
						this.vsp = this.jmpSpd * 0.7;
					}
				}
				this.xs = 0.75;
				this.ys = 1.25;
			}
			this.jmpHold = true;
			this.alarm[0] = 666;
		}

		if ((l_wall || r_wall) && !this.onGround && this.vsp >= 0.5) this.vsp -= GRAVITY * 0.5;
	}
	updateCollision() {
		if (this.bound.l + this.hsp <= 32 || this.bound.r + this.hsp >= Room.w - 32) {
			if (this.hsp > 0) this.x = Room.w - 32 - this.mid.w;
			if (this.hsp < 0) this.x = 32 + this.mid.w;
			if (Math.abs(this.hsp) > 0) {
				this.xs = 0.75;
				this.ys = 1.25;
			}
			this.hsp = 0;
		}

		if (this.bound.t + this.vsp <= 32 || this.bound.b + this.vsp >= Room.h - 32) {
			if (this.vsp < 0) this.y = 32 + this.h;
			if (this.vsp > 0) this.y = Room.h - 32;
			if (this.vsp > 10) {
				OBJ.take(Camera)[0].shake(this.vsp * 50);
				HEALTH -= this.vsp;
			}
			this.vsp = 0;
		}

		this.x += this.hsp;
		this.y += this.vsp;

		if (this.bound.b >= Room.h - 32) this.onGround = true;
		else {
			if (this.jmpHold) {
				this.vsp += GRAVITY * 0.5;
			}
			else {
				this.vsp += GRAVITY;
			}
			this.onGround = false;
		}
	}
	updateKeepScale() {
		this.xs += Math.sign(Math.dif(this.xs, 1)) * 0.06;
		this.ys += Math.sign(Math.dif(this.ys, 1)) * 0.06;
	}
	update() {
		this.updateControls();
		this.updateCollision();
		this.updateKeepScale();
	}
	render() {
		Draw.setColor(this.c);
		const key_a = Input.keyHold(this.keyA);
		const key_d = Input.keyHold(this.keyD);
		const l_wall = this.bound.l <= 32;
		const r_wall = this.bound.r >= Room.w - 32;
		if (l_wall && key_a) {
			Draw.rect(this.x - this.mid.w, this.y, this.w * this.xs, -this.h * this.ys);
		}
		else if (r_wall && key_d) {
			Draw.rect(this.x + this.mid.w, this.y, -this.w * this.xs, -this.h * this.ys);
		}
		else Draw.rect(this.x - this.mid.w * this.xs, this.y, this.w * this.xs, -this.h * this.ys);
	}
	alarm0() {
		this.jmpHold = false;
	}
}

class Weapon extends BranthBehaviour {
	constructor(x, y, d) {
		super(x, y);
		this.yto = this.y;
		this.y -= 32;
		this.d = d;
		this.dto = 90;
		this.pushBack = 0;
		this.canShoot = false;
	}
	update() {
		this.y = Math.lerp(this.y, this.yto, 0.1);
		this.d = Math.lerp(this.d, this.dto, 0.3);
		this.pushBack = Math.lerp(this.pushBack, 0, 0.1);
		if (this.canShoot) {
			this.shoot();
			this.canShoot = false;
		}
	}
	render() {
		const pb = Math.lendir(this.pushBack, this.d + 180);
		Draw.setColor(C.black);
		Draw.rectTransformed(this.x + pb.x * 0.5, this.y + pb.y * 0.5, 32, 32, this.d);
		Draw.setColor(C.white);
		Draw.circle(this.x + Math.lendirx(10, this.d) + pb.x, this.y + Math.lendiry(10, this.d) + pb.y, 4);
	}
}

class WeaponGun extends Weapon {
	constructor(x, y, d1, d2) {
		super(x, y, d1);
		this.d1 = d1;
		this.d2 = d2;
		this.alarm[0] = 1200;
		this.alarm[1] = 1000;
	}
	shoot() {
		const n = new Bullet(this.x + Math.lendirx(10, this.d), this.y + Math.lendiry(10, this.d), this.d);
		OBJ.push(Bullet, n);
		this.pushBack = 10;
		this.alarm[0] = 200;
	}
	alarm0() {
		this.canShoot = true;
	}
	alarm1() {
		this.dto = this.d2;
		this.alarm[2] = 1000;
	}
	alarm2() {
		this.dto = this.d1;
		this.alarm[1] = 1000;
	}
}

class Bullet extends BranthBehaviour {
	constructor(x, y, d) {
		super(x, y);
		this.d = d;
		this.spd = 5;
	}
	update() {
		this.x += Math.lendirx(this.spd, this.d);
		this.y += Math.lendiry(this.spd, this.d);
		if (this.x <= 32 || this.x >= Room.w - 32 || this.y <= 32 || this.y >= Room.h - 32) {
			OBJ.destroy(this.id);
		}
	}
	render() {
		Draw.setColor(C.yellow);
		Draw.circle(this.x, this.y, 3);
		Draw.setColor(C.red);
		Draw.circle(this.x, this.y, 2);
	}
}

class WeaponSpawner extends BranthBehaviour {
	awake() {
		this.alarm[0] = 1;
	}
	alarm0() {
		const n = new WeaponGun(Room.w * 0.25, 32, 15, 105);
		OBJ.push(WeaponGun, n);
		this.alarm[1] = 500;
	}
	alarm1() {
		const n = new WeaponGun(Room.w * 0.75, 32, 75, 165);
		OBJ.push(WeaponGun, n);
	}
}

OBJ.add(Camera);
OBJ.add(Player);
OBJ.add(Weapon);
OBJ.add(WeaponGun);
OBJ.add(Bullet);
OBJ.add(WeaponSpawner);

let LEVEL = 10;
let HEALTH = 100;
let UI_HEALTH = 100;
let MAX_HEALTH = 100;
let GAME_OVER = false;
const PLAYER_EXISTS = [0, 0, 0, 0];

Game.start = () => {
	OBJ.create(Camera);
	OBJ.create(WeaponSpawner);
}

Game.update = () => {
	if (PLAYER_EXISTS[0] === 0 && Input.keyDown(KeyCode.Down)) {
		const controls = {
			keyW: KeyCode.Up,
			keyA: KeyCode.Left,
			keyS: KeyCode.Down,
			keyD: KeyCode.Right
		};
		const p = new Player(Room.mid.w, Room.mid.h, controls, C.skyBlue);
		OBJ.push(Player, p);
		PLAYER_EXISTS[0] = 1;
	}
	if (PLAYER_EXISTS[1] === 0 && Input.keyDown(KeyCode.S)) {
		const controls = {
			keyW: KeyCode.W,
			keyA: KeyCode.A,
			keyS: KeyCode.S,
			keyD: KeyCode.D
		};
		const p = new Player(Room.mid.w, Room.mid.h, controls, C.pink);
		OBJ.push(Player, p);
		PLAYER_EXISTS[1] = 1;
	}
	if (HEALTH <= 0) {
		LEVEL--;
		MAX_HEALTH = 100 + 10 * (10 - LEVEL);
		HEALTH = MAX_HEALTH;
	}
	if (LEVEL <= 0) {
		GAME_OVER = true;
	}
}

Game.renderUI = () => {
	let text = ``;

	// Walls
	Draw.setColor(C.gray);
	Draw.rect(View.x - 32, View.y - 32, Room.w + 64, 64);
	Draw.rect(View.x - 32, View.y + Room.h + 32, Room.w + 64, -64);
	Draw.rect(View.x - 32, View.y - 32, 64, Room.h + 64);
	Draw.rect(View.x + Room.w + 32, View.y - 32, -64, Room.h + 64);

	// Level
	Draw.setColor(C.black);
	Draw.setHVAlign(Align.c, Align.t);
	Draw.setFont(`bold ${Font.l}`);
	if (LEVEL > 1) {
		text = `Destroy this floor ${LEVEL}!`;
	}
	else if (LEVEL > 0) {
		text = `One more floor to destroy!`;
	}
	else {
		text = `Congrats! You've destroyed the building!`;
	}
	Draw.text(Room.mid.w, 50, text);

	// Healthbar
	const barW = Room.w - 256;
	UI_HEALTH = Math.lerp(UI_HEALTH, HEALTH, 0.2);
	if (!GAME_OVER) {
		Draw.setColor(C.lime);
		Draw.roundRect(128, 92, barW * Math.clamp(UI_HEALTH / MAX_HEALTH, 0, 1), 16, 5);
	}
	Draw.setColor(C.black);
	Draw.roundRect(128, 92, barW, 16, 5, true);

	// Info
	Draw.setColor(C.white);
	Draw.setHVAlign(Align.c, Align.m);
	Draw.setFont(Font.m);
	text = ``;
	if (PLAYER_EXISTS[0] === 0) {
		text = `Press <Down> to spawn P1.`;
	}
	else if (PLAYER_EXISTS[1] === 0) {
		text = `Press <S> to spawn P2.`;
	}
	else {
		text = `Jump high then release to hit the floor hard and decrease the building's health.`;
	}
	Draw.text(Room.mid.w, Room.h - 16, text);
}

BRANTH.start();
Room.start('Game');