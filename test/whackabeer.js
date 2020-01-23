Math.clamp = (a, b, c) => Math.min(c, Math.max(b, a));
Math.range = (min, max) => min + Math.random() * (max - min);
Math.randneg = () => Math.random() > 0.5? -1 : 1;
Math.degtorad = (d = 1) => d * Math.PI / 180;
Math.lendirx = (l, d) => l * Math.cos(Math.degtorad(d));
Math.lendiry = (l, d) => l * Math.sin(Math.degtorad(d));
Math.choose = (...args) => args[Math.floor(Math.random() * args.length)];

const LINK_FONT = document.createElement('link');
LINK_FONT.href = 'https://fonts.googleapis.com/css?family=Fresca&display=swap';
LINK_FONT.rel = 'stylesheet';
const CANVAS = document.createElement('canvas');
const CANVAS_RATIO = {
	get w() {
		return CANVAS.width / CANVAS.getBoundingClientRect().width;
	},
	get h() {
		return CANVAS.height / CANVAS.getBoundingClientRect().height;
	}
};
const CANVAS_SCALER = 2;
const SCALER = {
	get w() {
		return CANVAS.width / 360;
	},
	get h() {
		return CANVAS.height / 640;
	}
};
const CTX = CANVAS.getContext('2d');
CANVAS.style.backgroundImage = `radial-gradient(beige 33%, blanchedalmond)`;

const Time = {
	time: 0,
	lastTime: 0,
	deltaTime: 0,
	fixedDeltaTime: 1000 / 60,
	update(t) {
		this.lastTime = this.time || 0;
		this.time = t || 0;
		this.deltaTime = this.time - this.lastTime || this.fixedDeltaTime;
	}
};

class BranthKey {
	constructor(keyCode) {
		this.keyCode = keyCode;
		this.hold = false;
		this.pressed = false;
		this.released = false;
	}
	up() {
		this.hold = false;
		this.released = true;
	}
	down() {
		this.hold = true;
		this.pressed = true;
	}
	reset() {
		this.pressed = false;
		this.released = false;
	}
}

class BranthMouse extends BranthKey {
	get button() {
		return this.keyCode;
	}
}

class BranthTouch extends BranthKey {
	constructor(id) {
		super(id);
		this.position = {
			x: 0,
			y: 0
		}
	}
	get id() {
		return this.keyCode;
	}
}

const Input = {
	list: [[], []],
	mouseMove: false,
	reset() {
		for (const i of this.list) {
			for (const j of i) {
				j.reset();
			}
		}
		this.mouseMove = false;
	},
	convert(p) {
		return {
			x: p.x * CANVAS_RATIO.w,
			y: p.y * CANVAS_RATIO.h
		};
	},
	mousePosition: {
		x: 0,
		y: 0
	},
	getMouse(button) {
		return this.list[0][button];
	},
	mouseUp(button) {
		return this.list[0][button].released;
	},
	mouseDown(button) {
		return this.list[0][button].pressed;
	},
	mouseHold(button) {
		return this.list[0][button].hold;
	},
	updateMousePosition(e) {
		const b = CANVAS.getBoundingClientRect();
		this.mousePosition.x = e.clientX - b.x;
		this.mousePosition.y = e.clientY - b.y;
		this.mouseMove = true;
	},
	eventmouseup(e) {
		this.updateMousePosition(e);
		this.list[0][e.button].up();
	},
	eventmousemove(e) {
		this.updateMousePosition(e);
	},
	eventmousedown(e) {
		const m = this.list[0][e.button];
		if (!m.hold) {
			this.updateMousePosition(e);
			m.down();
		}
	},
	touches: [],
	changedTouches: [],
	get touchCount() {
		return this.touches.length;
	},
	get changedTouchCount() {
		return this.changedTouches.length;
	},
	getTouch(id) {
		return this.list[1][id];
	},
	touchUp(id) {
		return this.list[1][id].released;
	},
	touchDown(id) {
		return this.list[1][id].pressed;
	},
	touchHold(id) {
		return this.list[1][id].hold;
	},
	updateTouches(e) {
		this.touches = [];
		this.changedTouches = [];
		for (let i = 0; i < e.touches.length; i++) {
			const b = CANVAS.getBoundingClientRect();
			const t = {
				id: e.touches[i].identifier,
				x: e.touches[i].clientX - b.x,
				y: e.touches[i].clientY - b.y
			}
			this.touches.push(t);
		}
		for (let i = 0; i < e.changedTouches.length; i++) {
			const b = CANVAS.getBoundingClientRect();
			const t = {
				id: e.changedTouches[i].identifier,
				x: e.changedTouches[i].clientX - b.x,
				y: e.changedTouches[i].clientY - b.y
			}
			this.changedTouches.push(t);
		}
	},
	eventtouchend(e) {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const b = CANVAS.getBoundingClientRect();
			const t = {
				id: e.changedTouches[i].identifier,
				x: e.changedTouches[i].clientX - b.x,
				y: e.changedTouches[i].clientY - b.y
			}
			this.list[1][t.id].position = { x: t.x, y: t.y };
			this.list[1][t.id].up();
		}
		this.updateTouches(e);
	},
	eventtouchmove(e) {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const b = CANVAS.getBoundingClientRect();
			const t = {
				id: e.changedTouches[i].identifier,
				x: e.changedTouches[i].clientX - b.x,
				y: e.changedTouches[i].clientY - b.y
			}
			this.list[1][t.id].position = { x: t.x, y: t.y };
		}
		this.updateTouches(e);
	},
	eventtouchstart(e) {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const b = CANVAS.getBoundingClientRect();
			const t = {
				id: e.changedTouches[i].identifier,
				x: e.changedTouches[i].clientX - b.x,
				y: e.changedTouches[i].clientY - b.y
			}
			if(!this.list[1][t.id].hold) {
				this.list[1][t.id].position = { x: t.x, y: t.y };
				this.list[1][t.id].down();
			}
		}
		this.updateTouches(e);
	}
};

Input.list[0] = [new BranthMouse(0)];
Input.list[1] = [
	new BranthTouch(0),
	new BranthTouch(1),
	new BranthTouch(2),
	new BranthTouch(3),
	new BranthTouch(4)
];

const C = {
	black: '#000000',
	blueViolet: '#8a2be2',
	cola: 'rgba(70, 0, 0, 0.5)',
	gold: '#ffd700',
	white: '#ffffff'
};

const Font = {
	get s() {
		return `${10 * SCALER.w * 0.5}px`;
	},
	get m() {
		return `${16 * SCALER.w * 0.5}px`;
	},
	get l() {
		return `${24 * SCALER.w * 0.5}px`;
	},
	get xl() {
		return `${36 * SCALER.w * 0.5}px`;
	},
	get xxl() {
		return `${48 * SCALER.w * 0.5}px`;
	},
	get size() {
		return +CTX.font.split(' ').filter(v => v.includes('px')).shift().replace('px', '');
	}
};

const Align = {
	l: 'left',
	r: 'right',
	c: 'center',
	t: 'top',
	b: 'bottom',
	m: 'middle'
};

const Draw = {
	list: [],
	names: [],
	add(name, ...src) {
		this.list.push([]);
		this.names.push(name);
		for (const s of src) {
			const img = new Image(); img.src = s;
			this.list[this.names.indexOf(name)].push(img);
		}
	},
	getSprite(name) {
		return this.list[this.names.indexOf(name)];
	},
	getImage(name, index) {
		return this.list[this.names.indexOf(name)][index];
	},
	sprite(name, index, x, y, xscale, yscale, rot) {
		const img = this.list[this.names.indexOf(name)][index];
		const dw = img.width * xscale;
		const dh = img.height * yscale;
		const dx = -dw * 0.5;
		const dy = -dh * 0.5;
		CTX.save();
		CTX.translate(x, y);
		CTX.rotate(rot * Math.PI / 180);
		CTX.drawImage(img, dx, dy, dw, dh);
		CTX.restore();
	},
	setFont(f) {
		CTX.font = `${f} Fresca, sans-serif`;
	},
	setAlpha(a) {
		CTX.globalAlpha = a;
	},
	setColor(c) {
		CTX.fillStyle = c;
		CTX.strokeStyle = c;
	},
	setShadow(x, y, b, c) {
		CTX.shadowBlur = b || 0;
		CTX.shadowColor = c || C.black;
		CTX.shadowOffsetX = x;
		CTX.shadowOffsetY = y;
	},
	resetShadow() {
		this.setShadow(0, 0, 0, C.black);
	},
	setHVAlign(h, v) {
		CTX.textAlign = h;
		CTX.textBaseline = v;
	},
	text(x, y, text) {
		CTX.fillText(text, x, y);
	},
	circle(x, y, r) {
		CTX.beginPath();
		CTX.arc(x, y, r, 0, 2 * Math.PI);
		CTX.fill();
	}
};

const OBJ = {
	ID: 0,
	list: [],
	classes: [],
	add(cls) {
		this.list.push([]);
		this.classes.push(cls);
	},
	get(id) {
		for (const o of this.list) {
			for (const i of o) {
				if (i) {
					if (i.id === id) {
						return i;
					}
				}
			}
		}
	},
	take(cls) {
		return this.list[this.classes.indexOf(cls)];
	},
	push(cls, i) {
		if (this.classes.includes(cls)) {
			this.list[this.classes.indexOf(cls)].push(i);
		}
	},
	create(cls, x, y) {
		const n = new cls(x, y);
		this.list[this.classes.indexOf(cls)].push(n);
		n.start();
		return n;
	},
	update() {
		for (const o of this.list) {
			for (const i of o) {
				if (i) {
					i.earlyUpdate();
					i.update();
					if (i.visible) {
						i.render();
						i.renderUI();
					}
				}
			}
		}
	},
	destroy(id) {
		for (const o of this.list) {
			for (const i in o) {
				if (o[i].id === id) {
					delete o[i];
				}
			}
		}
	},
	clear(cls) {
		this.list[this.classes.indexOf(cls)] = [];
	},
	clearAll() {
		for (const i in this.list) {
			this.list[i] = [];
		}
	}
};

const Room = {
	get w() {
		return CANVAS.getBoundingClientRect().width;
	},
	get h() {
		return CANVAS.getBoundingClientRect().height;
	},
	get mid() {
		return {
			w: this.w * 0.5,
			h: this.h * 0.5
		};
	}
};

const View = {
	x: 0,
	y: 0,
	alarm: -1,
	interval: 120,
	shake(int) {
		if (typeof int === 'number') {
			this.interval = int;
			window.navigator.vibrate(int);
		}
		this.alarm = this.interval;
	},
	update() {
		if (this.alarm <= 0) {
			if (this.alarm !== -1) {
				this.x = 0;
				this.y = 0;
				this.alarm = -1;
			}
		}
		else {
			this.alarm -= Time.deltaTime;
			const t = Math.max(0, this.alarm / 60);
			this.x = Math.range(t * 0.9, t * 1.1) * Math.randneg();
			this.y = Math.range(t * 0.9, t * 1.1) * Math.randneg();
		}
	}
};

class BranthObject {
	constructor(x, y) {
		this.id = OBJ.ID++;
		this.x = x;
		this.y = y;
		this.visible = true;
		this.hspeed = 0;
		this.vspeed = 0;
		this.rspeed = 0;
		this.gravity = 0.5;
		this.imageIndex = 0;
		this.imageAngle = 0;
		this.imageXScale = 1;
		this.imageYScale = 1;
		this.spriteIndex = '';
	}
	get mask() {
		const img = Draw.getImage(this.spriteIndex, this.imageIndex);
		return { r: Math.max(img.width * this.imageXScale, img.height * this.imageYScale) * 0.5 || 0 };
	}
	start() {}
	earlyUpdate() {
		this.x += this.hspeed;
		this.y += this.vspeed;
		this.vspeed += this.gravity;
		this.imageAngle += this.rspeed;
	}
	update() {}
	drawSelf() {
		Draw.sprite(this.spriteIndex, this.imageIndex, View.x + this.x, View.y + this.y, this.imageXScale, this.imageYScale, this.imageAngle);
	}
	render() {
		this.drawSelf();
	}
	renderUI() {}
}

Draw.add('Can', 'img/can_full.png', 'img/can_split_1.png', 'img/can_split_2.png');
Draw.add('Mug', 'img/mug_full.png', 'img/mug_split_1.png', 'img/mug_split_2.png');
Draw.add('Glass', 'img/glass_full.png', 'img/glass_split_1.png', 'img/glass_split_2.png');

const getSprite = () => Math.choose('Can', 'Mug', 'Glass');

Draw.add('Spot', 'img/spot.png');
Draw.add('Lives', 'img/lives.png');

let USER = {
	hit: 0,
	fast: 0,
	lives: 3,
	get score() {
		return this.hit * 10 + this.fast * 25;
	}
};

class BranthParticle extends BranthObject {
	constructor(x, y, spd, spdinc, size, sizeinc, d, dinc, r, rinc, a, c, life, grav) {
		super(x, y);
		this.spd = spd;
		this.spdinc = spdinc;
		this.size = size;
		this.sizeinc = sizeinc;
		this.d = d;
		this.dinc = dinc;
		this.r = r;
		this.rinc = rinc;
		this.a = a;
		this.c = c;
		this.life = life;
		this.grav = grav;
		this.g = grav;
	}
	earlyUpdate() {}
	update() {
		this.a = Math.max(0, this.a - Time.deltaTime / this.life);
		if (this.a <= 0) {
			OBJ.destroy(this.id);
		}
		this.x += Math.lendirx(this.spd, this.d);
		this.y += Math.lendiry(this.spd, this.d) + Math.lendiry(this.g, 90);
		this.size = Math.max(this.size + this.sizeinc, 0);
		this.spd += this.spdinc;
		this.g += this.grav;
		this.d += this.dinc;
		this.r += this.rinc;
	}
	render() {
		Draw.setAlpha(this.a);
		Draw.setColor(this.c);
		Draw.circle(this.x, this.y, this.size);
		Draw.setAlpha(1);
	}
}

const Emitter = {
	depth: 0,
	x: {
		min: 0,
		max: 100
	},
	y: {
		min: 0,
		max: 100
	},
	spd: {
		min: 1,
		max: 2
	},
	spdinc: {
		min: 0,
		max: 0
	},
	size: {
		min: 2,
		max: 8
	},
	sizeinc: {
		min: 0,
		max: 0
	},
	d: {
		min: 0,
		max: 360
	},
	dinc: {
		min: 5,
		max: 10
	},
	r: {
		min: 0,
		max: 360
	},
	rinc: {
		min: 5,
		max: 10
	},
	a: {
		min: 1,
		max: 1
	},
	c: C.cola,
	life: {
		min: 3000,
		max: 4000
	},
	grav: {
		min: 0.01,
		max: 0.01
	},
	setDepth(depth) {
		this.depth = depth;
	},
	setArea(xmin, xmax, ymin, ymax) {
		this.x.min = xmin;
		this.x.max = xmax;
		this.y.min = ymin;
		this.y.max = ymax;
	},
	setSpeed(min, max) {
		this.spd.min = min * SCALER.w * 0.5;
		this.spd.max = max * SCALER.w * 0.5;
	},
	setSpeedInc(min, max) {
		this.spdinc.min = min * SCALER.w * 0.5;
		this.spdinc.max = max * SCALER.w * 0.5;
	},
	setSize(min, max) {
		this.size.min = min * SCALER.w * 0.5;
		this.size.max = max * SCALER.w * 0.5;
	},
	setSizeInc(min, max) {
		this.sizeinc.min = min * SCALER.w * 0.5;
		this.sizeinc.max = max * SCALER.w * 0.5;
	},
	setDirection(min, max) {
		this.d.min = min;
		this.d.max = max;
	},
	setDirectionInc(min, max) {
		this.dinc.min = min;
		this.dinc.max = max;
	},
	setRotation(min, max) {
		this.r.min = min;
		this.r.max = max;
	},
	setRotationInc(min, max) {
		this.rinc.min = min;
		this.rinc.max = max;
	},
	setAlpha(min, max) {
		this.a.min = min;
		this.a.max = max;
	},
	setColor(c) {
		this.c = c;
	},
	setLife(min, max) {
		this.life.min = min;
		this.life.max = max;
	},
	setGravity(min, max) {
		this.grav.min = min;
		this.grav.max = max;
	},
	preset(s) {
		switch (s) {
			case 'bigstar':
				this.setSpeed(4, 7);
				this.setSpeedInc(-0.05, -0.05);
				this.setSize(15, 22);
				this.setSizeInc(-0.1, -0.1);
				this.setDirection(180, 360);
				this.setDirectionInc(0, 0);
				this.setRotation(0, 0);
				this.setRotationInc(0, 0);
				this.setAlpha(0.2, 0.2);
				this.setColor(C.gold);
				this.setLife(3000, 4000);
				this.setGravity(0, 0);
				break;
			case 'sparkle':
				this.setSpeed(2, 5);
				this.setSpeedInc(-0.1, -0.1);
				this.setSize(5, 10);
				this.setSizeInc(-0.1, -0.1);
				this.setDirection(0, 360);
				this.setDirectionInc(0, 0);
				this.setRotation(0, 0);
				this.setRotationInc(0, 0);
				this.setAlpha(1, 1);
				this.setColor(C.cola);
				this.setLife(1000, 2000);
				this.setGravity(0, 0);
				break;
			case 'puff':
				this.setSize(3, 5);
				this.setColor(C.gold);
				break;
		}
	},
	emit(n) {
		for (let i = 0; i < n; i++) {
			const n = new BranthParticle(
				Math.range(this.x.min, this.x.max),
				Math.range(this.y.min, this.y.max),
				Math.range(this.spd.min, this.spd.max),
				Math.range(this.spdinc.min, this.spdinc.max),
				Math.range(this.size.min, this.size.max),
				Math.range(this.sizeinc.min, this.sizeinc.max),
				Math.range(this.d.min, this.d.max),
				Math.range(this.dinc.min, this.dinc.max),
				Math.range(this.r.min, this.r.max),
				Math.range(this.rinc.min, this.rinc.max),
				Math.range(this.a.min, this.a.max),
				this.c,
				Math.range(this.life.min, this.life.max),
				Math.range(this.grav.min, this.grav.max)
			);
			n.depth = this.depth;
			OBJ.push(BranthParticle, n);
		}
	}
};

class Split extends BranthObject {
	update() {
		if (this.y > Room.h + this.mask.r * 2) {
			OBJ.destroy(this.id);
		}
	}
}

class Mole extends BranthObject {
	start() {
		this.gravity = 0;
		this.spriteIndex = getSprite();
		this.imageXScale = 0;
		this.imageYScale = 0;
		this.scaleTo = Math.range(0.9, 1.1);
		this.interval = 2000;
		this.alarm = this.interval;
	}
	hover(m) {
		return Math.hypot(m.x - this.x, m.y - this.y) <= this.mask.r * 1.2;
	}
	hit() {
		const r = Math.randneg() > 0;
		for (let i = 0; i < 2; i++) {
			const n = OBJ.create(Split, this.x, this.y);
			n.hspeed = (-1 + i * 2) * Math.range(1, 2);
			n.vspeed = -Math.range(8, 13);
			n.rspeed = n.hspeed * Math.range(0.5, 1.5);
			n.imageIndex = r? 1 + i : 2 - i;
			n.imageAngle = this.imageAngle;
			n.imageXScale = this.imageXScale;
			n.imageYScale = this.imageYScale;
			n.spriteIndex = this.spriteIndex;
		}
		USER.hit++;
		if (this.alarm / this.interval > 0.6) {
			USER.fast++;
			Emitter.preset('bigstar');
			Emitter.setArea(this.x, this.x, this.y, this.y);
			Emitter.setDirection(0, 360);
			Emitter.emit(10);
		}
		const sp = OBJ.take(Spawner)[0];
		sp.getSpot(this.c, this.r).isEmpty = true;
		if (USER.hit > 0 && sp.interval > 200) {
			if (sp.interval > 600) {
				if (USER.hit % 5 === 0) {
					sp.interval *= 0.9;
				}
			}
			else {
				if (USER.hit % 10 === 0) {
					sp.interval *= 0.9;
				}
			}
		}
		Emitter.setArea(this.x, this.x, this.y, this.y);
		Emitter.preset('sparkle');
		Emitter.emit(10);
		Emitter.preset('puff');
		Emitter.emit(10);
		View.shake(240);
		OBJ.destroy(this.id);
	}
	update() {
		this.x = this.c * Room.w * 0.25;
		this.y = this.r * Room.h * 0.25 + Room.h * 0.05;
		if (!Game.over) {
			if (this.scaleTo > 0) {
				if (Input.touchCount > 0) {
					for (let i = 0; i < Input.touchCount; i++) {
						if (Input.touchDown(i)) {
							if (this.hover(Input.getTouch(i).position)) {
								this.hit();
							}
						}
					}
				}
				else {
					if (Input.mouseDown(0)) {
						if (this.hover(Input.mousePosition)) {
							this.hit();
						}
					}
				}
			}
		}
		else {
			this.alarm = 0;
		}
		this.imageXScale += 0.2 * (this.scaleTo * SCALER.w * 0.125 - this.imageXScale);
		this.imageYScale = this.imageXScale;
		this.alarm -= Time.deltaTime;
		if (this.alarm <= 0) {
			if (this.scaleTo > 0) {
				USER.lives--;
				if (USER.lives <= 0) {
					USER.lives = 0;
					Game.over = true;
					Game.overTime = 0;
				}
				Emitter.setArea(this.x, this.x, this.y, this.y);
				Emitter.preset('sparkle');
				Emitter.preset('puff');
				Emitter.setColor(C.cola);
				Emitter.emit(10);
				View.shake(240);
				this.scaleTo = 0;
			}
			if (this.imageXScale <= 0.05) {
				OBJ.take(Spawner)[0].getSpot(this.c, this.r).isEmpty = true;
				OBJ.destroy(this.id);
			}
		}
	}
	render() {
		Draw.setAlpha(Math.clamp(this.imageXScale / 0.125, 0, 1));
		this.drawSelf();
		Draw.setAlpha(1);
	}
	renderUI() {
		if (this.scaleTo > 0) {
			const img = Draw.getImage(this.spriteIndex, this.imageIndex);
			const s = SCALER.w * 0.5;
			const b = {
				x: this.x,
				y: this.y - img.height * this.imageYScale * 0.8,
				w: 100 * s,
				h: 8 * s
			};
			Draw.setAlpha(0.5);
			Draw.setColor(C.blueViolet);
			const t = Math.sin(this.imageAngle * 0.01) * 5 * s;
			CTX.fillRect(b.x - b.w * 0.5, b.y - b.h + t, Math.max(0, this.alarm / this.interval) * b.w, b.h);
			Draw.setAlpha(1);
		}
	}
}

class Spot extends BranthObject {
	start() {
		this.spriteIndex = 'Spot';
		this.scaleTo = 1;
		this.reset();
	}
	reset() {
		this.imageXScale = 1.2 * SCALER.w * 0.125;
		this.imageYScale = 1.2 * SCALER.w * 0.125;
	}
	update() {
		this.x = this.c * Room.w * 0.25;
		this.y = this.r * Room.h * 0.25 + Room.h * 0.05;
		this.visible = !Game.over;
		this.scaleTo = this.isEmpty? 0.95 : 1;
		this.imageXScale += 0.2 * (this.scaleTo * SCALER.w * 0.125 - this.imageXScale);
		this.imageYScale = this.imageXScale;
	}
}

class Spawner extends BranthObject {
	start() {
		this.spots = [];
		for (let c = 1; c <= 3; c++) {
			for (let r = 1; r <= 3; r++) {
				const n = OBJ.create(Spot, 0, 0);
				n.c = c;
				n.r = r;
				n.isEmpty = true;
				this.spots.push(n);
			}
		}
		this.spriteIndex = 'Can';
		this.interval = 2000;
		this.alarm = this.interval;
	}
	reset() {
		this.interval = 2000;
		this.alarm = this.interval;
		for (let i = 0; i < this.spots.length; i++) {
			this.spots[i].reset();
		}
	}
	getSpot(c, r) {
		for (let i = 0; i < this.spots.length; i++) {
			const s = this.spots[i];
			if (s.c === c && s.r === r) {
				return s;
			}
		}
		return null;
	}
	update() {
		if (!Game.over) {
			this.alarm -= Time.deltaTime;
			if (this.alarm <= 0) {
				const emptySpotsIndex = [];
				for (let i = 0; i < this.spots.length; i++) {
					const s = this.spots[i];
					if (s.isEmpty) {
						emptySpotsIndex.push(i);
					}
				}
				if (emptySpotsIndex.length > 0) {
					const s = this.spots[emptySpotsIndex[Math.floor(Math.random() * emptySpotsIndex.length)]];
					const n = OBJ.create(Mole, s.x, s.y);
					n.c = s.c;
					n.r = s.r;
					n.rspeed = Math.range(5, 8) * Math.randneg();
					s.isEmpty = false;
				}
				this.alarm = this.interval;
			}
		}
	}
}
OBJ.add(Spawner);
OBJ.add(Spot);
OBJ.add(Mole);
OBJ.add(Split);
OBJ.add(BranthParticle);

const Game = {
	over: false,
	overTime: 0,
	start() {
		OBJ.create(Spawner, -Room.w, 0);
	},
	reset() {
		USER.hit = 0;
		USER.fast = 0;
		USER.lives = 3;
		OBJ.take(Spawner)[0].reset();
		Game.over = false;
	},
	update() {
		this.render();
	},
	render() {
		Draw.setColor(C.black);
		if (Game.over) {
			Game.overTime += Time.deltaTime;
			if (Game.overTime > 2000) {
				if (Input.touchCount > 0) {
					for (let i = 0; i < Input.touchCount; i++) {
						if (Input.touchDown(i)) {
							Game.reset();
							break;
						}
					}
				}
				else {
					if (Input.mouseDown(0)) {
						Game.reset();
					}
				}
			}
			Emitter.preset('bigstar');
			Emitter.setArea(Room.mid.w - 32, Room.mid.w + 32, Room.h - 32, Room.h + 32);
			Emitter.emit(1);
			Draw.setFont(Font.xxl);
			Draw.setShadow(0, Font.size * 0.1, Font.size * 0.1, C.black);
			Draw.setAlpha(Math.clamp(Game.overTime / 60, 0, 1));
			Draw.setHVAlign(Align.c, Align.t);
			let t = Math.sin(Time.time * 0.0025) * Font.size * 0.025;
			Draw.text(View.x + Room.mid.w, View.y + Font.size * 0.4 + t, 'Game Over');
			Draw.setFont(Font.l);
			Draw.setShadow(0, Font.size * 0.1, Font.size * 0.1, C.black);
			const x1 = Font.size * 2, x2 = Room.w - Font.size * 5, x3 = Room.w - Font.size * 2, y1 = Room.mid.h - Font.size * 4, y2 = Room.mid.h - Font.size * 2, y3 = Room.mid.h;
			Draw.setHVAlign(Align.l, Align.m);
			Draw.text(View.x + x1, View.y + y1, `Total hit:`);
			Draw.text(View.x + x1, View.y + y2, `Fast hit:`);
			Draw.setHVAlign(Align.r, Align.m);
			Draw.text(View.x + x2, View.y + y1, USER.hit);
			Draw.text(View.x + x2, View.y + y2, USER.fast);
			Draw.text(View.x + x3, View.y + y1, '(x10)');
			Draw.text(View.x + x3, View.y + y2, '(x25)');
			Draw.setFont(Font.xl);
			Draw.setShadow(0, Font.size * 0.1, Font.size * 0.1, C.black);
			Draw.setHVAlign(Align.l, Align.m);
			Draw.text(View.x + x1, View.y + y3, `Score:`);
			Draw.setHVAlign(Align.r, Align.m);
			t = Math.sin(Time.time * 0.01) * Font.size * 0.05;
			Draw.text(View.x + x2, View.y + y3 + t, USER.score);
			Draw.setFont(Font.m);
			Draw.setShadow(0, Font.size * 0.1, Font.size * 0.1, C.black);
			Draw.setAlpha(Math.clamp((Game.overTime - 1760) / 240, 0, 1));
			Draw.setHVAlign(Align.c, Align.b);
			t = Math.sin(Time.time * 0.0025) * Font.size * 0.025;
			Draw.text(View.x + Room.mid.w, View.y + Room.h - Font.size + t, `Tap anywhere to play again`);
			Draw.setAlpha(1);
			Draw.resetShadow();
		}
		else {
			Draw.setFont(Font.xl);
			Draw.setHVAlign(Align.l, Align.t);
			Draw.setShadow(0, Font.size * 0.1, Font.size * 0.1, C.black);
			Draw.text(Font.size * 0.5, Font.size * 0.2, USER.hit);
			for (let i = 0; i < USER.lives; i++) {
				const img = Draw.getImage('Lives', 0),
					xs = SCALER.w * 0.125,
					w = img.width * xs,
					h = img.height * xs,
					x = Font.size * 0.5 + i * w * 1.2 + w * 0.5,
					y = Font.size + h;
				let t = Math.sin((Time.time + i * 300) * 0.005) * Font.size * 0.05;
				let ts = 0;
				if (USER.lives === 1) {
					ts = Math.sin((Time.time + i * 300) * 0.02) * 0.01;
					t = 0;
				}
				Draw.sprite('Lives', 0, x, y + t, xs + ts, xs + ts, 0);
			}
			Draw.resetShadow();
		}
	}
};

const RAF = window.requestAnimationFrame
	|| window.msRequestAnimationFrame
	|| window.mozRequestAnimationFrame
	|| window.webkitRequestAnimationFrame
	|| function(f) { return setTimeout(f, Time.fixedDeltaTime) }
const BRANTH = {
	active: false,
	start() {
		OBJ.clearAll();
		Game.start();
		BRANTH.active = true;
		BRANTH.update();
	},
	update(t) {
		if (BRANTH.active) {
			Time.update(t);
			View.update();
			CTX.clearRect(0, 0, Room.w, Room.h);
			OBJ.update();
			Game.update();
			Input.reset();
			RAF(BRANTH.update);
		}
	},
	resize() {
		CANVAS.width = CANVAS.getBoundingClientRect().width * CANVAS_SCALER;
		CANVAS.height = CANVAS.getBoundingClientRect().height * CANVAS_SCALER;
		CTX.resetTransform();
		CTX.scale(CANVAS_SCALER, CANVAS_SCALER);
	}
};

const startWhackABeer = () => {
	document.body.appendChild(CANVAS);
	document.head.appendChild(LINK_FONT);
	CANVAS.requestFullscreen().then(() => {
		document.onfullscreenchange = () => {
			if (!document.fullscreen) {
				document.body.removeChild(CANVAS);
				BRANTH.active = false;
			}
		};
		window.onmouseup = (e) => Input.eventmouseup(e);
		window.onmousemove = (e) => Input.eventmousemove(e);
		window.onmousedown = (e) => Input.eventmousedown(e);
		window.ontouchstart = (e) => Input.eventtouchstart(e);
		window.ontouchmove = (e) => Input.eventtouchmove(e);
		window.ontouchend = (e) => Input.eventtouchend(e);
		window.onresize = () => BRANTH.resize();
		BRANTH.resize();
		BRANTH.start();
	});
};