// Boss类
class Boss extends Sprite {
    constructor(x, y, settings, assetManager) {
        super(x, y, 80, 100, '#800080');
        this.settings = settings;
        this.assetManager = assetManager;
        this.hp = 20;
        this.maxHP = this.hp;
        this.direction = -1;
        this.speed = 3;
        this.jumpVelocity = 0;
        this.isOnGround = true;
        this.isJumping = false;
        
        // AI状态
        this.aiState = 'enter'; // enter, patrol, jump, attack1, attack2
        this.aiTimer = 0;
        this.attackCooldown = 0;
        this.jumpCooldown = 0;
        
        // 攻击模式
        this.attack1Timer = 0;
        this.attack2Timer = 0;
        this.burstShotCount = 0;
        
        this.targetPlayer = null;
        this.points = 1000;
        
        // 动画
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        // 创建Boss图像
        this.createBossImages();
        
        // 设置初始位置
        this.y = settings.groundY - this.height;
    }
    
    createBossImages() {
        this.images = {
            idle: Utils.createRect(this.width, this.height, '#800080'),
            walk1: Utils.createRect(this.width, this.height, '#a000a0'),
            walk2: Utils.createRect(this.width, this.height, '#600060'),
            jump: Utils.createRect(this.width, this.height, '#ff00ff'),
            attack: Utils.createRect(this.width, this.height, '#ff8000')
        };
        this.image = this.images.idle;
    }
    
    update(player, bulletManager) {
        if (!this.alive) return;
        
        this.targetPlayer = player;
        this.updateAI(bulletManager);
        this.updatePhysics();
        this.updateAnimation();
        this.updateTimers();
        
        super.update();
    }
    
    updateAI(bulletManager) {
        if (!this.targetPlayer || !this.targetPlayer.settings.playerIsAlive) return;
        
        const distanceToPlayer = Utils.getDistance(
            this.x, this.y,
            this.targetPlayer.x, this.targetPlayer.y
        );
        
        // AI状态机
        switch (this.aiState) {
            case 'enter':
                // Boss入场
                this.vx = -2;
                if (this.x <= this.settings.screenWidth - 200) {
                    this.aiState = 'patrol';
                    this.vx = 0;
                    this.aiTimer = 0;
                }
                break;
                
            case 'patrol':
                this.patrol();
                
                // 根据血量和距离选择攻击模式
                if (this.attackCooldown === 0) {
                    if (distanceToPlayer < 150 && Math.random() < 0.3) {
                        this.aiState = 'jump';
                        this.aiTimer = 0;
                    } else if (this.hp < this.maxHP * 0.5 && Math.random() < 0.4) {
                        this.aiState = 'attack2';
                        this.aiTimer = 0;
                        this.burstShotCount = 0;
                    } else if (Math.random() < 0.2) {
                        this.aiState = 'attack1';
                        this.aiTimer = 0;
                    }
                }
                break;
                
            case 'jump':
                this.jumpAttack(bulletManager);
                break;
                
            case 'attack1':
                this.attack1(bulletManager);
                break;
                
            case 'attack2':
                this.attack2(bulletManager);
                break;
        }
        
        this.aiTimer++;
    }
    
    patrol() {
        // 简单的左右巡逻
        if (this.aiTimer % 120 === 0) {
            this.direction *= -1;
        }
        
        this.vx = this.direction * this.speed * 0.5;
        
        // 限制在屏幕范围内
        if (this.x <= this.settings.screenWidth * 0.5) {
            this.direction = 1;
        } else if (this.x >= this.settings.screenWidth - this.width) {
            this.direction = -1;
        }
    }
    
    jumpAttack(bulletManager) {
        if (this.isOnGround && this.jumpCooldown === 0) {
            this.jump();
            this.jumpCooldown = 180; // 3秒跳跃冷却
        }
        
        // 跳跃时朝玩家方向移动
        if (!this.isOnGround && this.targetPlayer) {
            const dx = this.targetPlayer.x - this.x;
            this.direction = dx > 0 ? 1 : -1;
            this.vx = this.direction * this.speed * 2;
        }
        
        // 落地后射击
        if (this.isOnGround && this.aiTimer > 30) {
            this.shootAtPlayer(bulletManager);
            this.aiState = 'patrol';
            this.attackCooldown = 60;
            this.aiTimer = 0;
        }
    }
    
    attack1(bulletManager) {
        // 普通攻击：朝玩家射击
        this.vx = 0; // 停止移动
        
        if (this.aiTimer % 30 === 0 && this.aiTimer < 120) {
            this.shootAtPlayer(bulletManager);
        }
        
        if (this.aiTimer >= 120) {
            this.aiState = 'patrol';
            this.attackCooldown = 90;
            this.aiTimer = 0;
        }
    }
    
    attack2(bulletManager) {
        // 强化攻击：连发射击
        this.vx = 0;
        
        if (this.aiTimer % 10 === 0 && this.burstShotCount < 8) {
            this.shootSpread(bulletManager);
            this.burstShotCount++;
        }
        
        if (this.burstShotCount >= 8) {
            this.aiState = 'patrol';
            this.attackCooldown = 150;
            this.aiTimer = 0;
        }
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
        if (['attack1', 'attack2'].includes(this.aiState)) {
            this.image = this.images.attack;
        } else if (!this.isOnGround) {
            this.image = this.images.jump;
        } else if (Math.abs(this.vx) > 0.1) {
            this.animationTimer++;
            if (this.animationTimer >= 20) {
                this.animationTimer = 0;
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.image = this.animationFrame === 0 ? this.images.walk1 : this.images.walk2;
            }
        } else {
            this.image = this.images.idle;
        }
    }
    
    updateTimers() {
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.jumpCooldown > 0) this.jumpCooldown--;
    }
    
    jump() {
        if (this.isOnGround) {
            this.isJumping = true;
            this.isOnGround = false;
            this.jumpVelocity = this.settings.bossJumpVel;
        }
    }
    
    shootAtPlayer(bulletManager) {
        if (!this.targetPlayer) return;
        
        const dx = this.targetPlayer.x - this.x;
        const dy = this.targetPlayer.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const direction = {
            x: dx / distance,
            y: dy / distance
        };
        
        const shootPos = this.getCenter();
        bulletManager.createBullet(shootPos.x, shootPos.y, direction, 'enemy');
    }
    
    shootSpread(bulletManager) {
        // 散射攻击
        const angles = [-0.5, -0.25, 0, 0.25, 0.5];
        const shootPos = this.getCenter();
        
        angles.forEach(angle => {
            const direction = {
                x: Math.cos(angle) * this.direction,
                y: Math.sin(angle)
            };
            bulletManager.createBullet(shootPos.x, shootPos.y, direction, 'enemy');
        });
    }
    
    takeDamage(damage = 1) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.alive = false;
            this.settings.gameWin = true;
            return true;
        }
        return false;
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        // 根据方向翻转图像
        if (this.direction === -1) {
            ctx.scale(-1, 1);
            ctx.drawImage(this.image, -this.x - this.width, this.y, this.width, this.height);
        } else {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
        
        ctx.restore();
        
        // 绘制血条
        this.renderHealthBar(ctx);
    }
    
    renderHealthBar(ctx) {
        const barWidth = 200;
        const barHeight = 10;
        const barX = (this.settings.screenWidth - barWidth) / 2;
        const barY = 30;
        
        // 背景
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // 血量
        ctx.fillStyle = '#ff0000';
        const healthWidth = (this.hp / this.maxHP) * barWidth;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
        
        // Boss名称
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', this.settings.screenWidth / 2, barY - 5);
    }
}

// Boss管理器
class BossManager {
    constructor(settings, assetManager) {
        this.settings = settings;
        this.assetManager = assetManager;
        this.boss = null;
        this.bossSpawned = false;
    }
    
    update(player, bulletManager) {
        // 检查是否应该生成Boss
        if (!this.bossSpawned && this.settings.enemiesKilled >= 10) {
            this.spawnBoss();
        }
        
        if (this.boss && this.boss.alive) {
            this.boss.update(player, bulletManager);
        } else if (this.boss && !this.boss.alive) {
            // Boss死亡，游戏胜利
            this.settings.score += this.boss.points;
            this.settings.gameWin = true;
        }
    }
    
    spawnBoss() {
        this.settings.bossAppear = true;
        const x = this.settings.screenWidth;
        const y = this.settings.groundY;
        this.boss = new Boss(x, y, this.settings, this.assetManager);
        this.bossSpawned = true;
    }
    
    render(ctx) {
        if (this.boss && this.boss.alive) {
            this.boss.render(ctx);
        }
    }
    
    getBoss() {
        return this.boss && this.boss.alive ? this.boss : null;
    }
    
    clear() {
        this.boss = null;
        this.bossSpawned = false;
        this.settings.bossAppear = false;
    }
}
