class Sand extends MovableSolid {
    constructor(x, y) {
        let offset = randomIntFromRange(0, 20) - 10;
        let col = [195 + offset, 195 + offset, 145 + offset, 255];
        super(x, y, col);
        this.outFlow = 0.3;
        this.outFlowFriction = 0.8;
        this.inertialResistance = 0.01;
        this.heatCapacity = 0.835;
        this.thermalConductivity = 0.27;

        this.meltPoint = K + 1200;
        this.meltElement = Lava;
    }
}


class Water extends Liquid {
    constructor(x, y) {
        let offset = randomIntFromRange(0, 30) - 15;
        let col = [102 + offset, 171 + offset, 230 + offset / 2, 150];
        super(x, y, col);
        this.dispersionRate = 4;
        this.heatCapacity = 4.1816;
        this.thermalConductivity = 0.6233;

        this.freezePoint = 0;
        this.freezeElement = Ice;

        this.boilPoint = K + 100;
        this.boilElement = Steam;
    }
}

class Steam extends Gas {
    constructor(x, y) {
        let offset = randomIntFromRange(0, 30) - 15;
        let col = [200 + offset, 200 + offset, 220 + offset / 2, 150];
        super(x, y, col);
        this.dispersionRate = 4;
        this.heatCapacity = 2.03;
        this.thermalConductivity = 0.6797;

        this.condensePoint = K + 100;
        this.condenseElement = Water;

    }
}
class Ice extends Solid {
    constructor(x, y) {
        let offset = randomIntFromRange(0, 30) - 15;
        let col = [200 + offset, 200 + offset, 220 + offset / 2, 150];
        super(x, y, col);
        this.heatCapacity = 2.05;
        this.thermalConductivity = 0.5551;

        this.meltPoint = K + 0;
        this.meltElement = Water;
    }
}

class Stone extends Solid {
    constructor(x, y, offset = 0, img, texX, texY) {
        let col = [255, 255, 255, 255]
        if (img) {
            let texData = getWholeImageDataFromSpriteSheet(img, texX, texY)
            col = [images.imageData.data[texData] - 150 + offset, images.imageData.data[texData + 1] - 150 + offset, images.imageData.data[texData + 2] - 150 + offset, 255];
        } else {
            col = [200 + offset, 200 + offset, 220 + offset / 2, 150];
        }
        super(x, y, col);
        this.heatCapacity = 0.880;
        this.thermalConductivity = 1.19;

        this.meltPoint = K + 1200;
        this.meltElement = Basalt;
    }
}


class Lava extends Liquid {
    constructor(x, y) {
        let offset = randomIntFromRange(0, 30) - 15;
        let col = [240 + offset, 165 + offset, 0, 255];
        super(x, y, col);
        this.dispersionRate = 2;
        this.heatCapacity = 0.880;
        this.thermalConductivity = 0.54;

        this.flowChance = 0.05;
        this.freezePoint = K + 1200;
        this.freezeElement = Basalt;

        this.boilPoint = Infinity;
    }
}
class Basalt extends MovableSolid {
    constructor(x, y) {
        let offset = randomIntFromRange(0, 30) - 15;
        let col = [30 + offset, 30 + offset, 30 + offset, 255];
        super(x, y, col);
        this.heatCapacity = 2.05;
        this.thermalConductivity = 0.5551;
        this.outFlow = 0;
        this.inertialResistance = 0.9;

        this.meltPoint = K + 1200;
        this.meltElement = Lava;
    }
}
