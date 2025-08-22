// 工具函数
class Utils {
    // 检测两个矩形是否碰撞
    static checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // 计算两点间距离
    static getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    // 限制数值在范围内
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    // 加载图片
    static loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    // 创建简单的矩形精灵
    static createRect(x, y, width, height, color = '#ff0000') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        return canvas;
    }
    
    // 生成随机数
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // 生成随机整数
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// 输入管理器
class InputManager {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // 防止页面滚动
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    isPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    
    // 获取方向输入
    getDirection() {
        let x = 0, y = 0;
        if (this.isPressed('ArrowLeft')) x -= 1;
        if (this.isPressed('ArrowRight')) x += 1;
        if (this.isPressed('ArrowUp')) y -= 1;
        if (this.isPressed('ArrowDown')) y += 1;
        return { x, y };
    }
}
