// 主游戏类
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.settings = new Settings();
        this.inputManager = new InputManager();
        this.assetManager = new AssetManager();
        
        // 游戏对象
        this.player = null;
        this.bulletManager = null;
        this.enemyManager = null;
        this.bossManager = null;
        
        // 游戏状态
        this.gameState = 'loading'; // loading, start, playing, gameOver, win
        this.scrollOffset = 0;
        
        // UI元素
        this.setupUI();
        
        // 背景
        this.background = null;
        
        this.init();
    }
    
    setupUI() {
        this.livesElement = document.getElementById('lives');
        this.scoreElement = document.getElementById('score');
        this.startScreen = document.getElementById('startScreen');
        this.startButton = document.getElementById('startButton');
        
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });
    }
    
    createBackground() {
        // 使用实际的背景图片
        const bgImage = this.assetManager.getImage('background');
        
        // 创建可滚动的背景
        const canvas = document.createElement('canvas');
        canvas.width = this.settings.screenWidth * 2; // 可滚动的背景
        canvas.height = this.settings.screenHeight;
        const ctx = canvas.getContext('2d');
        
        // 绘制背景图片，拉伸以填充整个画布
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        return canvas;
    }
    
    drawCloud(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
        ctx.arc(x + 15, y - 15, 25, 0, Math.PI * 2);
        ctx.arc(x + 35, y - 15, 25, 0, Math.PI * 2);
        ctx.fill();
    }
    
    init() {
        // 首先加载所有资源
        this.assetManager.loadAssets(() => {
            // 资源加载完成后创建背景
            this.background = this.createBackground();
            
            // 初始化游戏对象
            this.player = new Player(this.settings, this.assetManager, this.settings.screenWidth / 2, this.settings.groundY);
            this.bulletManager = new BulletManager(this.settings, this.assetManager);
            this.enemyManager = new EnemyManager(this.settings, this.assetManager);
            this.bossManager = new BossManager(this.settings, this.assetManager);
            
            // 游戏状态改为开始屏幕
            this.gameState = 'start';
            
            this.gameLoop();
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.startScreen.style.display = 'none';
        this.settings.reset();
        this.player.reset();
        this.bulletManager.clear();
        this.enemyManager.clear();
        this.bossManager.clear();
        this.scrollOffset = 0;
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // 更新玩家
        this.player.update(this.inputManager);
        
        // 处理玩家射击
        if (this.player.isShooting && this.player.shoot()) {
            const shootPos = this.player.getShootPosition();
            this.bulletManager.createBullet(
                shootPos.x, shootPos.y,
                this.player.shootDirection,
                'player'
            );
        }
        
        // 更新子弹
        this.bulletManager.update();
        
        // 更新敌人
        this.enemyManager.update(this.player, this.bulletManager);
        
        // 更新Boss
        this.bossManager.update(this.player, this.bulletManager, this.scrollOffset);
        
        // 处理碰撞
        this.handleCollisions();
        
        // 更新屏幕滚动
        this.updateScrolling();
        
        // 更新UI
        this.updateUI();
        
        // 检查游戏结束条件
        this.checkGameEnd();
        
        // 检查难度提升
        if (this.settings.enemiesKilled > 0 && this.settings.enemiesKilled % 5 === 0) {
            this.settings.increaseDifficulty();
        }
    }
    
    handleCollisions() {
        const aliveEnemies = this.enemyManager.getAliveEnemies();
        const boss = this.bossManager.getBoss();
        
        // 玩家子弹与敌人的碰撞
        const playerBulletCollisions = this.bulletManager.checkCollisions(aliveEnemies, 'player');
        playerBulletCollisions.forEach(({ bullet, target }) => {
            bullet.alive = false;
            if (target.takeDamage(bullet.damage)) {
                // 敌人死亡
                this.settings.score += target.points;
            }
        });
        
        // 玩家子弹与Boss的碰撞
        if (boss) {
            const bossBulletCollisions = this.bulletManager.checkCollisions([boss], 'player');
            bossBulletCollisions.forEach(({ bullet, target }) => {
                bullet.alive = false;
                target.takeDamage(bullet.damage);
            });
        }
        
        // 敌人子弹与玩家的碰撞
        const enemyBulletCollisions = this.bulletManager.checkCollisions([this.player], 'enemy');
        enemyBulletCollisions.forEach(({ bullet, target }) => {
            bullet.alive = false;
            target.takeDamage();
        });
        
        // 玩家与敌人的直接碰撞
        aliveEnemies.forEach(enemy => {
            if (this.player.checkCollision(enemy)) {
                this.player.takeDamage();
            }
        });
        
        // 玩家与Boss的直接碰撞
        if (boss && this.player.checkCollision(boss)) {
            this.player.takeDamage();
        }
    }
    
    updateScrolling() {
        if (this.settings.screenRolling && !this.settings.bossAppear) {
            this.scrollOffset += this.settings.scrollSpeed;
        }
    }
    
    updateUI() {
        this.livesElement.textContent = this.player.lives;
        this.scoreElement.textContent = this.settings.score;
    }
    
    checkGameEnd() {
        if (!this.settings.playerIsAlive) {
            this.gameState = 'gameOver';
            this.showGameOverScreen();
        } else if (this.settings.gameWin) {
            this.gameState = 'win';
            this.showWinScreen();
        }
    }
    
    showGameOverScreen() {
        this.startScreen.style.display = 'flex';
        this.startScreen.innerHTML = `
            <h1>游戏结束</h1>
            <p>最终分数: ${this.settings.score}</p>
            <p>击杀敌人: ${this.settings.enemiesKilled}</p>
            <button id="restartButton">重新开始</button>
        `;
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.startGame();
        });
    }
    
    showWinScreen() {
        this.startScreen.style.display = 'flex';
        this.startScreen.innerHTML = `
            <h1>胜利!</h1>
            <p>恭喜你击败了Boss!</p>
            <p>最终分数: ${this.settings.score}</p>
            <p>击杀敌人: ${this.settings.enemiesKilled}</p>
            <button id="restartButton">重新开始</button>
        `;
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.startGame();
        });
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'loading') {
            this.renderLoadingScreen();
            return;
        }
        
        // 绘制背景
        if (this.background) {
            this.renderBackground();
        }
        
        if (this.gameState === 'playing') {
            // 绘制游戏对象
            this.player.render(this.ctx);
            this.bulletManager.render(this.ctx);
            this.enemyManager.render(this.ctx);
            this.bossManager.render(this.ctx);
            
            // 绘制地面线
            this.renderGround();
        }
    }
    
    renderLoadingScreen() {
        const progress = this.assetManager.getLoadProgress();
        
        // 绘制加载背景
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制标题
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CONTRA', this.canvas.width / 2, this.canvas.height / 2 - 100);
        
        // 绘制加载进度条
        const barWidth = 400;
        const barHeight = 20;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = this.canvas.height / 2;
        
        // 进度条背景
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 进度条填充
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // 进度文本
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`加载中... ${Math.round(progress * 100)}%`, this.canvas.width / 2, barY + 50);
    }
    
    renderBackground() {
        // 绘制滚动背景
        const bgX = -this.scrollOffset % this.background.width;
        this.ctx.drawImage(this.background, bgX, 0);
        if (bgX > -this.background.width) {
            this.ctx.drawImage(this.background, bgX + this.background.width, 0);
        }
    }
    
    renderGround() {
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.settings.groundY);
        this.ctx.lineTo(this.canvas.width, this.settings.groundY);
        this.ctx.stroke();
    }
}
