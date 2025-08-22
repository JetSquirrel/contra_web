// 玩家类
class Player extends Sprite {
    constructor(settings, assetManager, x, y) {
        super(x, y, 40, 50, '#00ff00');
        this.settings = settings;
        this.assetManager = assetManager;
        this.direction = 1; // 1为右，-1为左
        this.isMoving = false;
        this.isJumping = false;
        this.isShooting = false;
        this.isOnGround = true;
        this.shootDirection = { x: 1, y: 0 }; // 射击方向
        this.jumpVelocity = 0;
        this.lives = settings.playerLives;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.shootCooldown = 0;
        
        // 动画相关
        this.walkAnimationFrame = 0;
        this.walkAnimationTimer = 0;
        this.shootAnimationTimer = 0;
        
        // 设置初始位置
        this.y = settings.groundY - this.height;
    }
    
    createPlayerImages() {
        // 创建不同状态的图像
        this.images = {
            idle: Utils.createRect(this.width, this.height, '#00ff00'),
            walk1: Utils.createRect(this.width, this.height, '#00cc00'),
            walk2: Utils.createRect(this.width, this.height, '#00aa00'),
            jump: Utils.createRect(this.width, this.height, '#00ffff'),
            shoot: Utils.createRect(this.width, this.height, '#ffff00')
        };
        this.image = this.images.idle;
    }
    
    update(inputManager) {
        if (!this.settings.playerIsAlive) return;
        
        this.handleInput(inputManager);
        this.updatePhysics();
        this.updateAnimation();
        this.updateTimers();
        
        super.update();
    }
    
    handleInput(inputManager) {
        const direction = inputManager.getDirection();
        
        // 水平移动
        this.isMoving = false;
        if (direction.x !== 0) {
            this.direction = direction.x;
            this.isMoving = true;
            
            // 移动逻辑
            if (direction.x > 0) { // 向右
                if (this.settings.bossAppear || this.x <= this.settings.screenWidth / 2) {
                    this.x += this.settings.playerSpeed;
                } else {
                    // 屏幕滚动
                    this.settings.screenRolling = true;
                }
            } else { // 向左
                this.x = Math.max(0, this.x - this.settings.playerSpeed);
                this.settings.screenRolling = false;
            }
        } else {
            this.settings.screenRolling = false;
        }
        
        // 设置射击方向
        if (direction.y !== 0 || direction.x !== 0) {
            this.shootDirection = {
                x: direction.x || this.direction,
                y: direction.y
            };
        }
        
        // 跳跃
        if (inputManager.isPressed('KeyX') && this.isOnGround) {
            this.jump();
        }
        
        // 射击
        this.isShooting = inputManager.isPressed('Space');
    }
    
    updatePhysics() {
        // 重力和跳跃
        if (this.isJumping || !this.isOnGround) {
            this.jumpVelocity += this.settings.gravity;
            this.y += this.jumpVelocity;
            
            // 检查是否落地
            if (this.y >= this.settings.groundY - this.height) {
                this.y = this.settings.groundY - this.height;
                this.isOnGround = true;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }
        
        // 限制在屏幕内
        this.x = Utils.clamp(this.x, 0, this.settings.screenWidth - this.width);
    }
    
    updateAnimation() {
        if (this.isShooting) {
            this.shootAnimationTimer = 10;
        } else if (!this.isOnGround) {
            // 跳跃动画已在getCurrentSprite中处理
        } else if (this.isMoving) {
            this.walkAnimationTimer++;
            if (this.walkAnimationTimer >= 10) {
                this.walkAnimationTimer = 0;
                this.walkAnimationFrame = (this.walkAnimationFrame + 1) % 5;
            }
        }
    }
    
    updateTimers() {
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.shootAnimationTimer > 0) this.shootAnimationTimer--;
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer === 0) {
                this.invulnerable = false;
            }
        }
    }
    
    jump() {
        if (this.isOnGround) {
            this.isJumping = true;
            this.isOnGround = false;
            this.jumpVelocity = this.settings.jumpVel;
        }
    }
    
    canShoot() {
        return this.shootCooldown === 0;
    }
    
    shoot() {
        if (this.canShoot()) {
            this.shootCooldown = 8; // 射击冷却时间
            return true;
        }
        return false;
    }
    
    takeDamage() {
        if (this.invulnerable) return false;
        
        this.lives--;
        this.invulnerable = true;
        this.invulnerableTimer = 120; // 2秒无敌时间
        
        if (this.lives <= 0) {
            this.settings.playerIsAlive = false;
        }
        
        return true;
    }
    
    render(ctx) {
        if (!this.settings.playerIsAlive) return;
        
        // 无敌状态闪烁效果
        if (this.invulnerable && Math.floor(this.invulnerableTimer / 5) % 2 === 0) {
            return;
        }
        
        // 获取当前应该显示的精灵图片
        const sprite = this.getCurrentSprite();
        
        ctx.save();
        
        // 根据方向翻转图像
        if (this.direction === -1) {
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, -this.x - this.width, this.y, this.width, this.height);
        } else {
            ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        }
        
        ctx.restore();
    }
    
    getCurrentSprite() {
        const prefix = this.direction > 0 ? 'player_right' : 'player_left';
        
        // 死亡状态
        if (!this.settings.playerIsAlive) {
            return this.assetManager.getImage(`${prefix}_death1`);
        }
        
        // 射击状态
        if (this.isShooting && this.shootAnimationTimer > 0) {
            const shootFrame = Math.floor(this.shootAnimationTimer / 3) % 3 + 1;
            return this.assetManager.getImage(`${prefix}_shooting${shootFrame}`);
        }
        
        // 跳跃状态
        if (this.isJumping || !this.isOnGround) {
            const jumpFrame = Math.floor(this.jumpVelocity < 0 ? 1 : 3);
            return this.assetManager.getImage(`${prefix}_jump${jumpFrame}`);
        }
        
        // 移动状态
        if (this.isMoving) {
            const walkFrame = Math.floor(this.walkAnimationFrame) % 5 + 1;
            return this.assetManager.getImage(`${prefix}_${walkFrame}`);
        }
        
        // 默认站立状态
        return this.assetManager.getImage(`${prefix}`);
    }
    
    getShootPosition() {
        const center = this.getCenter();
        return {
            x: center.x + (this.direction > 0 ? this.width / 2 : -this.width / 2),
            y: center.y
        };
    }
    
    reset() {
        this.x = this.settings.screenWidth / 2 - this.width / 2;
        this.y = this.settings.groundY - this.height;
        this.lives = this.settings.playerLives;
        this.settings.playerIsAlive = true;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.isJumping = false;
        this.isOnGround = true;
        this.jumpVelocity = 0;
    }
}
