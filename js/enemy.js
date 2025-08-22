// 敌人类
class Enemy extends Sprite {
    constructor(x, y, settings, assetManager, type = 'soldier') {
        super(x, y, 30, 40, '#ff0000');
        this.settings = settings;
        this.assetManager = assetManager;
        this.type = type;
        this.hp = this.getInitialHP();
        this.maxHP = this.hp;
        this.direction = -1; // 默认向左移动
        this.speed = settings.enemySpeed;
        this.shootCooldown = 0;
        this.shootInterval = Utils.randomInt(60, 120); // 随机射击间隔
        this.points = this.getPoints();
        
        // AI状态
        this.aiState = 'patrol'; // patrol, chase, attack
        this.aiTimer = 0;
        this.targetPlayer = null;
        
        // 动画
        this.walkAnimationFrame = 0;
        this.walkAnimationTimer = 0;
        
        // 设置初始位置在地面上
        this.y = settings.groundY - this.height;
        this.vx = this.direction * this.speed;
    }
    
    getInitialHP() {
        switch (this.type) {
            case 'soldier': return 1;
            case 'heavy': return 3;
            case 'sniper': return 2;
            default: return 1;
        }
    }
    
    getPoints() {
        switch (this.type) {
            case 'soldier': return 100;
            case 'heavy': return 200;
            case 'sniper': return 150;
            default: return 100;
        }
    }
    
    createEnemyImages() {
        const colors = {
            soldier: '#ff0000',
            heavy: '#aa0000',
            sniper: '#ff6600'
        };
        
        this.images = {
            idle: Utils.createRect(this.width, this.height, colors[this.type]),
            walk1: Utils.createRect(this.width, this.height, colors[this.type]),
            walk2: Utils.createRect(this.width, this.height, colors[this.type])
        };
        this.image = this.images.idle;
    }
    
    update(player, bulletManager) {
        if (!this.alive) return;
        
        this.targetPlayer = player;
        this.updateAI();
        this.updateMovement();
        this.updateShooting(bulletManager);
        this.updateAnimation();
        this.updateTimers();
        
        super.update();
    }
    
    updateAI() {
        if (!this.targetPlayer || !this.targetPlayer.settings.playerIsAlive) return;
        
        const distanceToPlayer = Utils.getDistance(
            this.x, this.y,
            this.targetPlayer.x, this.targetPlayer.y
        );
        
        // AI状态机
        switch (this.aiState) {
            case 'patrol':
                if (distanceToPlayer < 200) {
                    this.aiState = 'chase';
                    this.aiTimer = 0;
                }
                break;
                
            case 'chase':
                if (distanceToPlayer > 300) {
                    this.aiState = 'patrol';
                } else if (distanceToPlayer < 100) {
                    this.aiState = 'attack';
                    this.aiTimer = 0;
                }
                break;
                
            case 'attack':
                if (distanceToPlayer > 150) {
                    this.aiState = 'chase';
                }
                break;
        }
        
        this.aiTimer++;
    }
    
    updateMovement() {
        switch (this.aiState) {
            case 'patrol':
                // 简单的巡逻移动
                this.vx = this.direction * this.speed;
                
                // 如果屏幕在滚动，调整位置
                if (this.settings.screenRolling) {
                    this.x -= this.settings.scrollSpeed;
                }
                break;
                
            case 'chase':
                // 追逐玩家
                if (this.targetPlayer) {
                    const dx = this.targetPlayer.x - this.x;
                    this.direction = dx > 0 ? 1 : -1;
                    this.vx = this.direction * this.speed * 1.5; // 追逐时速度更快
                }
                break;
                
            case 'attack':
                // 攻击状态下减速
                this.vx = this.direction * this.speed * 0.5;
                break;
        }
        
        // 防止敌人离开屏幕左侧太远
        if (this.x < -this.width * 2) {
            this.alive = false;
        }
    }
    
    updateShooting(bulletManager) {
        if (this.shootCooldown > 0) return;
        
        // 根据类型和AI状态决定是否射击
        let shouldShoot = false;
        
        switch (this.type) {
            case 'soldier':
                shouldShoot = this.aiState === 'attack' && this.aiTimer % this.shootInterval === 0;
                break;
            case 'heavy':
                shouldShoot = this.aiState === 'attack' && this.aiTimer % (this.shootInterval * 0.7) === 0;
                break;
            case 'sniper':
                shouldShoot = (this.aiState === 'chase' || this.aiState === 'attack') && 
                             this.aiTimer % (this.shootInterval * 1.5) === 0;
                break;
        }
        
        if (shouldShoot && this.targetPlayer) {
            this.shoot(bulletManager);
        }
    }
    
    shoot(bulletManager) {
        if (!this.targetPlayer) return;
        
        // 计算射击方向
        const dx = this.targetPlayer.x - this.x;
        const dy = this.targetPlayer.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const direction = {
            x: dx / distance,
            y: dy / distance
        };
        
        const shootPos = this.getCenter();
        bulletManager.createBullet(shootPos.x, shootPos.y, direction, 'enemy');
        
        this.shootCooldown = Utils.randomInt(30, 60);
    }
    
    updateAnimation() {
        if (Math.abs(this.vx) > 0.1) {
            this.walkAnimationTimer++;
            if (this.walkAnimationTimer >= 15) {
                this.walkAnimationTimer = 0;
                this.walkAnimationFrame = (this.walkAnimationFrame + 1) % 2;
                this.image = this.walkAnimationFrame === 0 ? this.images.walk1 : this.images.walk2;
            }
        } else {
            this.image = this.images.idle;
        }
    }
    
    updateTimers() {
        if (this.shootCooldown > 0) this.shootCooldown--;
    }
    
    takeDamage(damage = 1) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.alive = false;
            return true; // 返回true表示敌人死亡
        }
        return false;
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        // 获取当前精灵图片
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
        
        // 绘制血条（仅当血量不满时）
        if (this.hp < this.maxHP) {
            this.renderHealthBar(ctx);
        }
    }
    
    getCurrentSprite() {
        // 创建一个简单的敌人占位符图片
        return this.createEnemyPlaceholder();
    }
    
    createEnemyPlaceholder() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        
        // 绘制简单的敌人图像
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, 2, this.width - 4, this.height - 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.width / 4, this.height / 4, this.width / 2, this.height / 2);
        
        return canvas;
    }
    
    renderHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const barX = this.x;
        const barY = this.y - 8;
        
        // 背景
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 血量
        ctx.fillStyle = '#ff0000';
        const healthWidth = (this.hp / this.maxHP) * barWidth;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
    }
}

// 敌人管理器
class EnemyManager {
    constructor(settings, assetManager) {
        this.settings = settings;
        this.assetManager = assetManager;
        this.enemies = [];
        this.spawnTimer = 0;
        this.enemyTypes = ['soldier', 'heavy', 'sniper'];
    }
    
    update(player, bulletManager) {
        // 更新生成计时器
        this.spawnTimer++;
        
        // 生成新敌人
        if (this.spawnTimer >= this.settings.enemySpawnInterval && !this.settings.bossAppear) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
        
        // 更新所有敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(player, bulletManager);
            
            // 移除死亡的敌人
            if (!enemy.alive) {
                if (enemy.hp <= 0) {
                    // 敌人被击杀，增加分数
                    this.settings.score += enemy.points;
                    this.settings.enemiesKilled++;
                }
                this.enemies.splice(i, 1);
            }
        }
    }
    
    spawnEnemy() {
        // 随机选择敌人类型，考虑难度
        let typeIndex = 0;
        const rand = Math.random();
        
        if (this.settings.difficultyLevel >= 2 && rand < 0.3) {
            typeIndex = 1; // heavy
        } else if (this.settings.difficultyLevel >= 3 && rand < 0.2) {
            typeIndex = 2; // sniper
        }
        
        const type = this.enemyTypes[typeIndex];
        const x = this.settings.screenWidth + 50; // 从右侧出现
        const y = this.settings.groundY;
        
        const enemy = new Enemy(x, y, this.settings, this.assetManager, type);
        this.enemies.push(enemy);
    }
    
    render(ctx) {
        this.enemies.forEach(enemy => enemy.render(ctx));
    }
    
    getAliveEnemies() {
        return this.enemies.filter(enemy => enemy.alive);
    }
    
    clear() {
        this.enemies = [];
    }
    
    // 强制生成一批敌人
    spawnWave(count = 3) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.spawnEnemy();
            }, i * 500);
        }
    }
}
