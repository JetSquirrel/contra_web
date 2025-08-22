// 子弹类
class Bullet extends Sprite {
    constructor(x, y, direction, settings, assetManager, owner = 'player') {
        super(x, y, 8, 4, owner === 'player' ? '#ffff00' : '#ff0000');
        this.settings = settings;
        this.assetManager = assetManager;
        this.direction = direction;
        this.owner = owner;
        this.damage = 1;
        
        // 设置速度
        const speed = settings.bulletSpeed;
        this.vx = direction.x * speed;
        this.vy = direction.y * speed;
    }
    
    createBulletImage() {
        this.image = Utils.createRect(this.width, this.height, this.color);
    }
    
    update() {
        super.update();
        
        // 检查是否离开屏幕
        if (!this.isOnScreen(this.settings.screenWidth, this.settings.screenHeight)) {
            this.alive = false;
        }
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        // 使用实际的子弹图片
        const bulletImage = this.assetManager.getImage('bullet1');
        
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.drawImage(bulletImage, this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

// 子弹管理器
class BulletManager {
    constructor(settings, assetManager) {
        this.settings = settings;
        this.assetManager = assetManager;
        this.bullets = [];
    }
    
    createBullet(x, y, direction, owner = 'player') {
        const bullet = new Bullet(x, y, direction, this.settings, this.assetManager, owner);
        this.bullets.push(bullet);
        return bullet;
    }
    
    update() {
        // 更新所有子弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update();
            
            // 移除死亡的子弹
            if (!bullet.alive) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        this.bullets.forEach(bullet => bullet.render(ctx));
    }
    
    // 获取特定所有者的子弹
    getBulletsByOwner(owner) {
        return this.bullets.filter(bullet => bullet.owner === owner && bullet.alive);
    }
    
    // 检查子弹碰撞
    checkCollisions(targets, owner) {
        const bullets = this.getBulletsByOwner(owner);
        const collisions = [];
        
        bullets.forEach(bullet => {
            targets.forEach(target => {
                if (target.alive && bullet.checkCollision(target)) {
                    collisions.push({ bullet, target });
                }
            });
        });
        
        return collisions;
    }
    
    // 清除所有子弹
    clear() {
        this.bullets = [];
    }
    
    // 清除特定所有者的子弹
    clearByOwner(owner) {
        this.bullets = this.bullets.filter(bullet => bullet.owner !== owner);
    }
}
