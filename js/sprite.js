// 基础精灵类
class Sprite {
    constructor(x, y, width, height, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = 0; // x方向速度
        this.vy = 0; // y方向速度
        this.alive = true;
        this.image = null;
        this.animations = {};
        this.currentAnimation = null;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 5; // 动画播放速度
    }
    
    // 设置图片
    setImage(image) {
        this.image = image;
        if (image) {
            this.width = image.width;
            this.height = image.height;
        }
    }
    
    // 添加动画
    addAnimation(name, frames, speed = 5) {
        this.animations[name] = {
            frames: frames,
            speed: speed
        };
    }
    
    // 播放动画
    playAnimation(name) {
        if (this.currentAnimation !== name) {
            this.currentAnimation = name;
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
    }
    
    // 更新动画
    updateAnimation() {
        if (this.currentAnimation && this.animations[this.currentAnimation]) {
            const animation = this.animations[this.currentAnimation];
            this.animationTimer++;
            
            if (this.animationTimer >= animation.speed) {
                this.animationTimer = 0;
                this.animationFrame = (this.animationFrame + 1) % animation.frames.length;
                this.image = animation.frames[this.animationFrame];
            }
        }
    }
    
    // 更新位置
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.updateAnimation();
    }
    
    // 渲染
    render(ctx) {
        if (!this.alive) return;
        
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
    // 获取边界矩形
    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    // 检测碰撞
    checkCollision(other) {
        return Utils.checkCollision(this.getRect(), other.getRect());
    }
    
    // 获取中心点
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
    
    // 设置中心点位置
    setCenter(x, y) {
        this.x = x - this.width / 2;
        this.y = y - this.height / 2;
    }
    
    // 检查是否在屏幕内
    isOnScreen(screenWidth, screenHeight) {
        return this.x + this.width > 0 && 
               this.x < screenWidth && 
               this.y + this.height > 0 && 
               this.y < screenHeight;
    }
}
