const Menu = Branth.Room.add("Menu");

Branth.onLoadFinish = () => {
	Branth.Room.start("Menu");
};

Menu.render = () => {
	Branth.Draw.setFont(Branth.Font.xl);
	Branth.Draw.text(32, 64, "Hi there! Hellow Mwa haha.");
	Branth.Draw.rect(64, 80, 33, 90);
};

let options = {
	parentID: "gameContainer"
};

Branth.start(options);