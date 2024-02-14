class Sand extends MovableSolid {
    constructor(x, y) {
        let offset = randomIntFromRange(0, 20) - 10;
        let col = [195 + offset, 195 + offset, 145 + offset, 255];
        super(x, y, col);
        this.outFlow = 0.3;
        this.outFlowFriction = 0.8;
        this.inertialResistance = 0.01;
    }
}

class Water extends Liquid {
    constructor(x, y) {
        let offset = randomIntFromRange(0, 30) - 15;
        let col = [102 + offset, 171 + offset, 230 + offset / 2, 150];
        super(x, y, col);
        this.dispersionRate = 4;
    }
}

class Steam extends Gas {
    constructor(x, y) {
        let offset = randomIntFromRange(0, 30) - 15;
        let col = [200 + offset, 200 + offset, 220 + offset / 2, 150];
        super(x, y, col);
        this.dispersionRate = 4;
    }
}
class Ice extends Solid {
    constructor(x, y) {
        let offset = randomIntFromRange(0, 30) - 15;
        let col = [200 + offset, 200 + offset, 220 + offset / 2, 150];
        super(x, y, col);
        this.dispersionRate = 4;
    }
}